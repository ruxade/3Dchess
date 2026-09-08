// Glue between the rules and the 3D pieces.
//
// The rules decide what is legal. This file makes the meshes agree with the
// rules: move the piece, knock a captured piece off the board (physics) or
// slide it to the graveyard (physics off), move the castling rook, swap a
// promoted pawn, bounce back illegal drops. It also decides who may be picked
// up (only the side to move, only a human side, nobody once the game is over),
// runs the computer opponent, and can undo by resyncing meshes to the rules.
// It also keeps the chess clock and saves the game to localStorage after
// every move, so a refresh carries on where you were.

import * as THREE from 'three'
import { gsap } from 'gsap'
import { CAMERA, DRAG, GRAVEYARD, HOVER, EFFECTS, CLOCK, OPPONENT, VICTORY, CAPTURE_STYLES, SHATTER, GAME_OVER, GAME_STORAGE_KEY } from '../config.js'
import { nameToSquare, squareName, squareToWorld } from './coords.js'
import { createClock } from './clock.js'
import { createPieceSet } from '../scene/pieces.js'
import { loadJson, saveJson } from '../core/storage.js'

/** Before the settings panel is built: bring back the opponent, colour and clock from the saved game. */
export function applySavedSettings(settings) {
  const saved = loadJson(GAME_STORAGE_KEY)?.settings
  if (!saved) return
  if (OPPONENT.levels.includes(saved.opponent)) settings.opponent = saved.opponent
  if (saved.humanColour === 'light' || saved.humanColour === 'dark') settings.humanColour = saved.humanColour
  if (saved.clock in CLOCK.presets) settings.clock = saved.clock
  if (CAPTURE_STYLES.includes(saved.captures)) settings.captures = saved.captures
  if (saved.shatterSound in SHATTER.sounds) settings.shatterSound = saved.shatterSound
}

export function createGameController({
  rules, pieces, geometries, materials, highlights, status, dragControls, physics, sound, effects,
  camera, settings, opponent, movesUi, promotionUi, clocksUi, outline, celebrate, shatter, environment
}) {
  const bySquare = new Map()                 // 'e2' -> mesh
  const captured = { light: 0, dark: 0 }     // graveyard slots used (physics off)
  let legalFromHere = []                     // legal moves of the piece being carried
  let thinking = 0                           // token: a reply older than this is ignored
  let lastPuff = 0
  let clock = null                           // the chess clock, or null when off
  let celebration = null                     // the delayed call that opens the victory screen
  let fallenKing = null                      // the loser's king, lying on its square, until a new game

  const worldOf = (square) => { const { col, row } = nameToSquare(square); return squareToWorld(col, row) }
  const computerColour = () => (settings.humanColour === 'light' ? 'dark' : 'light')
  const computerOn = () => settings.opponent !== 'off'
  const gameOver = () => rules.status().gameOver || !!clock?.flagged()
  const other = (colour) => (colour === 'light' ? 'dark' : 'light')

  /** The victory screen, after the last move has landed. Undo, reset and load call it off. */
  function scheduleCelebration(winner, reason, delay = VICTORY.delaySeconds) {
    celebration?.kill()
    celebration = gsap.delayedCall(delay, () => { celebration = null; celebrate?.({ winner, reason }) })
  }

  function index() {
    bySquare.clear()
    for (const piece of pieces.children) {
      if (piece.userData.captured) continue
      bySquare.set(squareName(piece.userData.col, piece.userData.row), piece)
    }
  }

  /** Who can be grabbed right now, and what the status line says. */
  function refresh() {
    const state = rules.status()
    const humanTurn = !computerOn() || state.turn === settings.humanColour
    dragControls.objects = gameOver() || !humanTurn
      ? []
      : pieces.children.filter((p) => p.userData.colour === state.turn && !p.userData.captured)
    if (clock?.flagged()) status.timeout(clock.flagged())
    else status.fromRules(state)
    movesUi.render(rules.history())
  }

  /** After any completed move: press the clock, save, whose camera, does the computer reply. */
  function afterMove(result) {
    index()
    const state = rules.status()
    if (clock) {
      clock.press(result.colour)
      if (state.gameOver) clock.stop()
    }
    refresh()
    persist()
    if (state.gameOver) {
      endGame(state.checkmate ? other(state.turn) : null)
      if (state.checkmate) scheduleCelebration(other(state.turn), 'checkmate')
      return
    }
    if (computerOn()) {
      if (state.turn === computerColour()) computerMove()
    } else if (settings.followTurn) {
      camera.flyToSide(state.turn)
    }
  }

  // ---- drag.js calls these ------------------------------------------------

  /** The glowing edge (OutlinePass) follows the piece under the cursor, and stays on a carried piece. */
  function select(piece) {
    if (outline) outline.selectedObjects = piece ? [piece] : []
  }

  function onHover(piece, hovering) {
    if (piece.userData.captured) return
    if (hovering) select(piece)
    else if (!piece.userData.carried) select(null)
    if (piece.userData.carried) return
    gsap.to(piece.position, { y: hovering ? HOVER.lift : 0, duration: HOVER.seconds, overwrite: 'auto' })
  }

  function onPickUp(piece) {
    gsap.killTweensOf(piece.position)
    piece.userData.carried = true
    select(piece)
    const from = squareName(piece.userData.col, piece.userData.row)
    legalFromHere = rules.legalMoves(from)
    highlights.show(from, legalFromHere)
  }

  function onCarry(piece, { col, row }) {
    const square = squareName(col, row)
    highlights.setTarget(square, legalFromHere.some((m) => m.to === square))
  }

  async function onDrop(piece, { col, row }) {
    highlights.clear()
    select(null)
    piece.userData.carried = false
    const from = squareName(piece.userData.col, piece.userData.row)
    const to = squareName(col, row)
    const target = legalFromHere.find((m) => m.to === to)

    if (!target) {
      flyTo(piece, from, DRAG.returnSeconds)   // illegal: back where it came from
      return false
    }

    let promotion = 'queen'
    if (target.promotion) {
      dragControls.enabled = false             // hold everything while you choose
      promotion = await promotionUi.ask()
      dragControls.enabled = settings.dragging
      if (!promotion) { flyTo(piece, from, DRAG.returnSeconds); return false }
    }

    commit(piece, from, to, promotion, 'settle')
    return true
  }

  /** Apply a legal move to the rules and the meshes. `arrival`: 'settle' (was carried) or 'fly' (computer, undo). */
  function commit(piece, from, to, promotion, arrival) {
    const result = rules.move(from, to, promotion)
    if (!result) { flyTo(piece, from, DRAG.returnSeconds); return null }

    if (result.captured) capture(bySquare.get(result.captured.square), from, to)
    if (arrival === 'settle') settle(piece, to)
    else flyTo(piece, to, 0.7)
    if (result.castle) flyTo(bySquare.get(result.castle.from), result.castle.to, DRAG.returnSeconds)
    if (result.promotion) retype(piece, result.promotion)

    afterMove(result)
    return result
  }

  // ---- the computer -------------------------------------------------------

  function computerMove() {
    const token = ++thinking
    status.show(`${computerColour() === 'light' ? 'White' : 'Black'} is thinking`)
    opponent.think(rules.fen(), settings.opponent).then((move) => {
      if (token !== thinking || !move) return
      const piece = bySquare.get(move.from)
      if (piece) commit(piece, move.from, move.to, move.promotion || 'queen', 'fly')
    })
  }

  // ---- movements ----------------------------------------------------------

  /** The carried piece is already over the square: drop it the last bit. */
  function settle(piece, square) {
    place(piece, square)
    gsap.to(piece.position, {
      x: piece.userData.x, y: 0, z: piece.userData.z,
      duration: DRAG.snapSeconds,
      ease: 'power2.out',
      onComplete: () => { physics.follow(piece); sound.hit(0.3) }
    })
  }

  /** Lift, travel, land. Used for bounce-backs, the castling rook, the computer, undo. */
  function flyTo(piece, square, seconds) {
    place(piece, square)
    gsap.killTweensOf(piece.position)
    gsap.timeline({ onComplete: () => { physics.follow(piece); sound.hit(0.2) } })
      .to(piece.position, { y: DRAG.liftHeight * 0.5, duration: seconds * 0.3, ease: 'power2.out' })
      .to(piece.position, { x: piece.userData.x, z: piece.userData.z, duration: seconds * 0.5, ease: 'power2.inOut' }, '<')
      .to(piece.position, { y: 0, duration: seconds * 0.3, ease: 'bounce.out' })
  }

  /** Record where a piece now belongs (the tween gets it there). */
  function place(piece, square) {
    const { col, row } = nameToSquare(square)
    const { x, z } = worldOf(square)
    Object.assign(piece.userData, { col, row, x, z })
  }

  /**
   * A piece has been taken. Settings, Game, "captures" decides how it goes:
   * 'knock' shoves it off the board (the capturer's direction of travel bends
   * the shove), 'shatter' cuts it into shards that fly apart, 'glide' slides it
   * to a graveyard slot beside the board. `style` overrides the setting.
   */
  function capture(piece, fromSquare, toSquare, style = settings.captures) {
    piece.userData.captured = true
    piece.userData.col = -1
    piece.userData.row = -1
    gsap.killTweensOf(piece.position)

    if (style !== 'glide') {
      const travel = new THREE.Vector3()
      if (fromSquare && toSquare) {
        const a = worldOf(fromSquare), b = worldOf(toSquare)
        travel.set(b.x - a.x, 0, b.z - a.z).normalize()
      }
      const shattered = style === 'shatter' && shatter.shatter(piece, travel, settings.knockStrength)
      if (!shattered) physics.knock(piece, travel, settings.knockStrength)
      else sound.crack(settings.knockStrength)
      effects.burst(new THREE.Vector3(piece.position.x, 0.6, piece.position.z), shattered ? EFFECTS.burstCount * 1.5 : EFFECTS.burstCount)
      return
    }

    toGraveyard(piece, false)
  }

  /** The next free slot in the columns beside the board. `instant` skips the glide. */
  function toGraveyard(piece, instant) {
    const colour = piece.userData.colour
    const n = captured[colour]++
    const side = colour === 'light' ? 1 : -1
    const x = side * (GRAVEYARD.firstColumnX + Math.floor(n / GRAVEYARD.perColumn) * GRAVEYARD.columnGap)
    const z = (n % GRAVEYARD.perColumn) - GRAVEYARD.perColumn / 2 + 0.5
    if (instant) {
      piece.position.set(x, 0, z)
      physics.follow(piece)
      return
    }
    gsap.timeline({ onComplete: () => physics.follow(piece) })
      .to(piece.position, { y: DRAG.liftHeight * 0.4, duration: 0.2, ease: 'power2.out' })
      .to(piece.position, { x, z, duration: 0.6, ease: 'power2.inOut' }, '<0.05')
      .to(piece.position, { y: 0, duration: 0.25, ease: 'bounce.out' })
  }

  /**
   * A restored game: put a captured piece back where it was lying (the saved
   * pose), hide it if it had shattered, or park it beside the board if there
   * is no usable pose (it was still in the air when the page closed).
   */
  function restFallen(piece, poses) {
    piece.userData.captured = true
    piece.userData.col = -1
    piece.userData.row = -1
    const i = poses.findIndex((p) => p.type === piece.userData.type && p.colour === piece.userData.colour)
    const pose = i >= 0 ? poses.splice(i, 1)[0] : null
    if (pose?.shattered) { shatter.vanish(piece); return }
    const settled = pose && pose.position[1] < 0 && Math.hypot(pose.position[0], pose.position[2]) > 4.2
    if (!settled) { toGraveyard(piece, true); return }
    piece.position.fromArray(pose.position)
    piece.quaternion.fromArray(pose.quaternion)
    physics.follow(piece)
  }

  /** A captured piece comes back (undo): whole, upright, static again. */
  function restore(piece) {
    piece.userData.captured = false
    piece.rotation.set(0, piece.userData.colour === 'dark' ? Math.PI : 0, 0)
    shatter.restore(piece)
    physics.restore(piece)
  }

  /** Change what a mesh is (promotion, or undoing one). */
  function retype(piece, type) {
    if (piece.userData.type === type) return
    piece.geometry = geometries[type]
    piece.name = piece.name.replace(piece.userData.type, type)
    piece.userData.type = type
    physics.reshape(piece)
  }

  /**
   * Make the meshes match the rules, whatever happened. Used by undo and by
   * loading a position. Pieces already in the right place stay put; the rest
   * fly to where they belong, come back from the plate, or get knocked off.
   * `instant` skips the flight (restoring a saved game at start-up); `fallen`
   * is then the saved list of where the captured pieces were lying.
   */
  function syncFromRules(instant = false, fallen = null) {
    const wanted = rules.pieces()
    const free = new Set(pieces.children)
    const todo = []

    for (const w of wanted) {
      const m = bySquare.get(w.square)
      if (m && !m.userData.captured && m.userData.type === w.type && m.userData.colour === w.colour) free.delete(m)
      else todo.push(w)
    }
    for (const w of todo) {
      const pool = [...free].filter((m) => m.userData.colour === w.colour)
      const m = pool.find((x) => x.userData.type === w.type && !x.userData.captured)
        || pool.find((x) => x.userData.type === w.type)
        || pool.find((x) => !x.userData.captured)
        || pool[0]
      if (!m) continue
      free.delete(m)
      retype(m, w.type)
      if (m.userData.captured) restore(m)
      if (instant) {
        place(m, w.square)
        gsap.killTweensOf(m.position)
        m.position.set(m.userData.x, 0, m.userData.z)
        physics.follow(m)
      } else {
        flyTo(m, w.square, 0.7)
      }
    }
    // Pieces that simply should not be there: back where they were lying (a restored
    // game), or knocked, not shattered, for a loaded position (nothing captured them).
    for (const m of free) {
      if (m.userData.captured) continue
      if (fallen) restFallen(m, fallen)
      else capture(m, null, null, settings.captures === 'shatter' ? 'knock' : settings.captures)
    }

    index()
    refresh()
  }

  // ---- the end of a game ---------------------------------------------------

  /** The loser's king topples and the world changes colour. `winner` null means a draw. `instant` for a restored game. */
  function endGame(winner, instant = false) {
    environment.setTint(GAME_OVER.tints[winner ?? 'draw'], instant ? 0 : GAME_OVER.tintSeconds)
    if (!winner || fallenKing) return
    const king = pieces.children.find((p) => p.userData.type === 'king' && p.userData.colour === other(winner) && !p.userData.captured)
    if (!king) return
    fallenKing = king
    const towardsCentre = king.userData.row < 3.5 ? 1 : -1         // it falls forward, towards the winner
    physics.topple(king, new THREE.Vector3((Math.random() - 0.5) * 0.4, 0, towardsCentre).normalize())
  }

  /** New game, undo or load: the king stands up and the colours come back. */
  function standUp() {
    environment.clearTint(0.8)
    if (!fallenKing) return
    const king = fallenKing
    fallenKing = null
    if (king.userData.captured || !pieces.children.includes(king)) return
    king.rotation.set(0, king.userData.colour === 'dark' ? Math.PI : 0, 0)
    king.position.set(king.userData.x, 0, king.userData.z)
    physics.restore(king)
  }

  // ---- commands -----------------------------------------------------------

  function undo() {
    if (promotionUi.isOpen() || clock?.flagged()) return    // out of time is final, press N
    thinking++                                              // drop any reply in flight
    celebration?.kill()
    if (!rules.undo()) return
    // Against the computer, take its move back too so it is your turn again.
    if (computerOn() && rules.turn() !== settings.humanColour) rules.undo()
    highlights.clear()
    select(null)
    standUp()
    syncFromRules()
    clock?.switchTo(rules.turn())                           // no time is refunded
    persist()
    const state = rules.status()
    if (!computerOn() && settings.followTurn && !state.gameOver) camera.flyToSide(state.turn, CAMERA.flySeconds, -1)   // rewind: back the way it came
    if (computerOn() && state.turn === computerColour() && !state.gameOver) computerMove()
  }

  /** Start over: fresh rules, fresh pieces, fresh bodies. */
  function reset() {
    thinking++
    celebration?.kill()
    rules.reset()
    highlights.clear()
    select(null)
    clock?.reset()
    fallenKing = null                                       // the meshes are about to be replaced
    environment.clearTint(0.8)
    gsap.killTweensOf(pieces.children.map((p) => p.position))
    shatter.clear()
    physics.clear()
    pieces.clear()
    createPieceSet(geometries, materials, pieces)
    for (const piece of pieces.children) physics.addPiece(piece)
    captured.light = 0
    captured.dark = 0
    index()
    refresh()
    persist()
    camera.flyToSide(computerOn() ? settings.humanColour : 'light')
    if (computerOn() && rules.turn() === computerColour()) computerMove()
  }

  /** Jump to any position (FEN). Handy from the console: chess.game.load('...'). */
  function load(fen) {
    thinking++
    celebration?.kill()
    rules.load(fen)
    highlights.clear()
    clock?.reset()
    standUp()
    syncFromRules()
    persist()
    if (computerOn() && rules.turn() === computerColour() && !gameOver()) computerMove()
  }

  /** Settings panel changed opponent or colour. */
  function onOpponentChange() {
    thinking++
    refresh()
    persist()
    camera.flyToSide(computerOn() ? settings.humanColour : rules.turn())
    if (computerOn() && rules.turn() === computerColour() && !gameOver()) computerMove()
  }

  // ---- the clock ------------------------------------------------------------

  function makeClock() {
    const preset = CLOCK.presets[settings.clock]
    clock = preset ? createClock(preset, onFlag) : null
    clocksUi.render(clock)
  }

  /** A side ran out of time: the game is over, nobody moves, the computer stops thinking. */
  function onFlag(colour) {
    thinking++
    refresh()
    persist()
    endGame(other(colour))
    scheduleCelebration(other(colour), 'time', 0.8)
  }

  /** Settings panel changed the clock. A game already under way puts the side to move on the clock at once. */
  function onClockChange() {
    makeClock()
    if (clock && rules.history().length > 0 && !gameOver()) clock.start(rules.turn())
    refresh()
    persist()
  }

  /** Once per frame, from main.js. */
  function tick(dt) {
    if (!clock) return
    clock.tick(dt)
    clocksUi.render(clock)
  }

  // ---- saving ---------------------------------------------------------------

  function persist() {
    saveJson(GAME_STORAGE_KEY, {
      pgn: rules.pgn(),
      settings: { opponent: settings.opponent, humanColour: settings.humanColour, clock: settings.clock, captures: settings.captures, shatterSound: settings.shatterSound },
      clock: clock ? { light: clock.remaining('light'), dark: clock.remaining('dark') } : null,
      fallen: pieces.children.filter((p) => p.userData.captured).map((p) => ({
        type: p.userData.type, colour: p.userData.colour, shattered: !!p.userData.shattered,
        position: p.position.toArray(), quaternion: p.quaternion.toArray()
      }))
    })
  }

  /** Bring back the saved game: pieces straight onto their squares, captured ones where they fell. Returns true if there was one. */
  function restoreSaved() {
    const saved = loadJson(GAME_STORAGE_KEY)
    if (!saved?.pgn || !rules.loadPgn(saved.pgn)) return false
    syncFromRules(true, Array.isArray(saved.fallen) ? [...saved.fallen] : [])
    if (clock && saved.clock) clock.setRemaining(saved.clock)   // it waits for the next move to run
    const state = rules.status()
    if (clock?.flagged()) endGame(other(clock.flagged()), true)
    else if (state.gameOver) endGame(state.checkmate ? other(state.turn) : null, true)
    return true
  }

  // ---- start up -----------------------------------------------------------

  for (const piece of pieces.children) physics.addPiece(piece)
  physics.onImpact((mesh, speed) => {
    if (speed > 0.8) sound.hit(speed / 8)
    const now = performance.now()
    if (speed > EFFECTS.impactThreshold && now - lastPuff > 150) {
      lastPuff = now
      effects.burst(mesh.position.clone().setY(Math.max(mesh.position.y, -0.9)), 14)
    }
  })

  physics.onRest(() => persist())                         // a knocked piece settled: remember where
  window.addEventListener('pagehide', () => persist())    // and whatever the state is when the tab goes

  window.addEventListener('keydown', (event) => {
    if (event.key === 'n' || event.key === 'N') reset()
  })

  makeClock()
  restoreSaved()                             // a game left half way carries on
  index()
  refresh()
  camera.flyToSide(computerOn() ? settings.humanColour : 'light', CAMERA.introSeconds)   // the intro flight
  if (computerOn() && rules.turn() === computerColour() && !gameOver()) computerMove()

  /** Settings panel picked another shatter sound: play it once so you can hear it, and remember it. */
  function onSoundChange() {
    sound.crack(settings.knockStrength)
    persist()
  }

  return { onPickUp, onCarry, onDrop, onHover, undo, reset, load, onOpponentChange, onClockChange, onSoundChange, tick, syncFromRules }
}

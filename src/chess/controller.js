// Glue between the rules and the 3D pieces.
//
// The rules decide what is legal. This file makes the meshes agree with the
// rules: move the piece, knock a captured piece off the board (physics) or
// slide it to the graveyard (physics off), move the castling rook, swap a
// promoted pawn, bounce back illegal drops. It also decides who may be picked
// up (only the side to move, only a human side, nobody once the game is over),
// runs the computer opponent, and can undo by resyncing meshes to the rules.

import * as THREE from 'three'
import { gsap } from 'gsap'
import { CAMERA, DRAG, GRAVEYARD, HOVER, EFFECTS } from '../config.js'
import { nameToSquare, squareName, squareToWorld } from './coords.js'
import { createPieceSet } from '../scene/pieces.js'

export function createGameController({
  rules, pieces, geometries, materials, highlights, status, dragControls, physics, sound, effects,
  camera, settings, opponent, movesUi, promotionUi
}) {
  const bySquare = new Map()                 // 'e2' -> mesh
  const captured = { light: 0, dark: 0 }     // graveyard slots used (physics off)
  let legalFromHere = []                     // legal moves of the piece being carried
  let thinking = 0                           // token: a reply older than this is ignored
  let lastPuff = 0

  const worldOf = (square) => { const { col, row } = nameToSquare(square); return squareToWorld(col, row) }
  const computerColour = () => (settings.humanColour === 'light' ? 'dark' : 'light')
  const computerOn = () => settings.opponent !== 'off'

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
    dragControls.objects = state.gameOver || !humanTurn
      ? []
      : pieces.children.filter((p) => p.userData.colour === state.turn && !p.userData.captured)
    status.fromRules(state)
    movesUi.render(rules.history())
  }

  /** After any completed move: whose camera, whose turn, does the computer reply. */
  function afterMove() {
    index()
    refresh()
    const state = rules.status()
    if (state.gameOver) return
    if (computerOn()) {
      if (state.turn === computerColour()) computerMove()
    } else if (settings.followTurn) {
      camera.flyToSide(state.turn)
    }
  }

  // ---- drag.js calls these ------------------------------------------------

  function onHover(piece, hovering) {
    if (piece.userData.captured || piece.userData.carried) return
    gsap.to(piece.position, { y: hovering ? HOVER.lift : 0, duration: HOVER.seconds, overwrite: 'auto' })
  }

  function onPickUp(piece) {
    gsap.killTweensOf(piece.position)
    piece.userData.carried = true
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

    afterMove()
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
   * A piece has been taken. With physics on, the capturer's direction of
   * travel becomes a shove and the simulation takes over. With physics off,
   * the piece glides to a graveyard slot beside the board.
   */
  function capture(piece, fromSquare, toSquare) {
    piece.userData.captured = true
    piece.userData.col = -1
    piece.userData.row = -1
    gsap.killTweensOf(piece.position)

    if (settings.physics) {
      const travel = new THREE.Vector3()
      if (fromSquare && toSquare) {
        const a = worldOf(fromSquare), b = worldOf(toSquare)
        travel.set(b.x - a.x, 0, b.z - a.z).normalize()
      }
      physics.knock(piece, travel)
      effects.burst(new THREE.Vector3(piece.position.x, 0.6, piece.position.z))
      return
    }

    const colour = piece.userData.colour
    const n = captured[colour]++
    const side = colour === 'light' ? 1 : -1
    const x = side * (GRAVEYARD.firstColumnX + Math.floor(n / GRAVEYARD.perColumn) * GRAVEYARD.columnGap)
    const z = (n % GRAVEYARD.perColumn) - GRAVEYARD.perColumn / 2 + 0.5
    gsap.timeline({ onComplete: () => physics.follow(piece) })
      .to(piece.position, { y: DRAG.liftHeight * 0.4, duration: 0.2, ease: 'power2.out' })
      .to(piece.position, { x, z, duration: 0.6, ease: 'power2.inOut' }, '<0.05')
      .to(piece.position, { y: 0, duration: 0.25, ease: 'bounce.out' })
  }

  /** A captured piece comes back (undo): upright, static again. */
  function restore(piece) {
    piece.userData.captured = false
    piece.rotation.set(0, piece.userData.colour === 'dark' ? Math.PI : 0, 0)
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
   */
  function syncFromRules() {
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
      flyTo(m, w.square, 0.7)
    }
    for (const m of free) if (!m.userData.captured) capture(m, null, null)

    index()
    refresh()
  }

  // ---- commands -----------------------------------------------------------

  function undo() {
    if (promotionUi.isOpen()) return
    thinking++                                              // drop any reply in flight
    if (!rules.undo()) return
    // Against the computer, take its move back too so it is your turn again.
    if (computerOn() && rules.turn() !== settings.humanColour) rules.undo()
    highlights.clear()
    syncFromRules()
    const state = rules.status()
    if (!computerOn() && settings.followTurn && !state.gameOver) camera.flyToSide(state.turn)
    if (computerOn() && state.turn === computerColour() && !state.gameOver) computerMove()
  }

  /** Start over: fresh rules, fresh pieces, fresh bodies. */
  function reset() {
    thinking++
    rules.reset()
    highlights.clear()
    gsap.killTweensOf(pieces.children.map((p) => p.position))
    physics.clear()
    pieces.clear()
    createPieceSet(geometries, materials, pieces)
    for (const piece of pieces.children) physics.addPiece(piece)
    captured.light = 0
    captured.dark = 0
    index()
    refresh()
    camera.flyToSide(computerOn() ? settings.humanColour : 'light')
    if (computerOn() && rules.turn() === computerColour()) computerMove()
  }

  /** Jump to any position (FEN). Handy from the console: chess.game.load('...'). */
  function load(fen) {
    thinking++
    rules.load(fen)
    highlights.clear()
    syncFromRules()
    if (computerOn() && rules.turn() === computerColour() && !rules.status().gameOver) computerMove()
  }

  /** Settings panel changed opponent or colour. */
  function onOpponentChange() {
    thinking++
    refresh()
    camera.flyToSide(computerOn() ? settings.humanColour : rules.turn())
    if (computerOn() && rules.turn() === computerColour() && !rules.status().gameOver) computerMove()
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

  window.addEventListener('keydown', (event) => {
    if (event.key === 'n' || event.key === 'N') reset()
  })

  index()
  refresh()
  camera.flyToSide(computerOn() ? settings.humanColour : 'light', CAMERA.introSeconds)   // the intro flight
  if (computerOn() && rules.turn() === computerColour()) computerMove()

  return { onPickUp, onCarry, onDrop, onHover, undo, reset, load, onOpponentChange, syncFromRules }
}

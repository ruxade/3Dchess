// Glue between the rules and the 3D pieces.
//
// The rules decide what is legal. This file makes the meshes agree with the
// rules: move the piece, knock a captured piece off the board (physics) or
// slide it to the graveyard (physics off), move the castling rook, swap a
// promoted pawn for a queen, bounce back illegal drops. It also decides which
// pieces may be picked up: only the side to move, nobody once the game is over.

import * as THREE from 'three'
import { gsap } from 'gsap'
import { DRAG, GRAVEYARD, HOVER } from '../config.js'
import { nameToSquare, squareName, squareToWorld } from './coords.js'
import { createPieceSet } from '../scene/pieces.js'

export function createGameController({
  rules, pieces, geometries, materials, highlights, status, dragControls, physics, sound, camera, settings
}) {
  const bySquare = new Map()                 // 'e2' -> mesh
  const captured = { light: 0, dark: 0 }     // graveyard slots used (physics off)
  let legalTargets = new Set()

  const worldOf = (square) => { const { col, row } = nameToSquare(square); return squareToWorld(col, row) }

  function index() {
    bySquare.clear()
    for (const piece of pieces.children) {
      if (piece.userData.captured) continue
      bySquare.set(squareName(piece.userData.col, piece.userData.row), piece)
    }
  }

  /** Only the side to move can be grabbed. Nobody can once the game is over. */
  function refreshDraggable() {
    const state = rules.status()
    dragControls.objects = state.gameOver
      ? []
      : pieces.children.filter((p) => p.userData.colour === state.turn && !p.userData.captured)
    status.fromRules(state)
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
    const moves = rules.legalMoves(from)
    legalTargets = new Set(moves.map((m) => m.to))
    highlights.show(from, moves)
  }

  function onCarry(piece, { col, row }) {
    const square = squareName(col, row)
    highlights.setTarget(square, legalTargets.has(square))
  }

  function onDrop(piece, { col, row }) {
    highlights.clear()
    piece.userData.carried = false
    const from = squareName(piece.userData.col, piece.userData.row)
    const to = squareName(col, row)
    const result = rules.move(from, to)

    if (!result) {
      flyTo(piece, from, DRAG.returnSeconds)   // illegal: back where it came from
      return false
    }

    if (result.captured) capture(bySquare.get(result.captured.square), from, to)
    settle(piece, to)
    if (result.castle) flyTo(bySquare.get(result.castle.from), result.castle.to, DRAG.returnSeconds)
    if (result.promotion) promote(piece, result.promotion)

    index()
    refreshDraggable()
    if (settings.followTurn && !rules.status().gameOver) camera.flyToSide(rules.turn())
    return true
  }

  // ---- movements ----------------------------------------------------------

  /** The carried piece is already over the square: drop it the last bit. */
  function settle(piece, square) {
    const { col, row } = nameToSquare(square)
    const { x, z } = worldOf(square)
    piece.userData.col = col
    piece.userData.row = row
    gsap.to(piece.position, {
      x, y: 0, z,
      duration: DRAG.snapSeconds,
      ease: 'power2.out',
      onComplete: () => { physics.follow(piece); sound.hit(0.3) }
    })
  }

  /** Lift, travel, land. Used for bounce-backs and the castling rook. */
  function flyTo(piece, square, seconds) {
    const { col, row } = nameToSquare(square)
    const { x, z } = worldOf(square)
    piece.userData.col = col
    piece.userData.row = row
    gsap.timeline({ onComplete: () => { physics.follow(piece); sound.hit(0.2) } })
      .to(piece.position, { y: DRAG.liftHeight * 0.5, duration: seconds * 0.3, ease: 'power2.out' })
      .to(piece.position, { x, z, duration: seconds * 0.5, ease: 'power2.inOut' }, '<')
      .to(piece.position, { y: 0, duration: seconds * 0.3, ease: 'bounce.out' })
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
      const a = worldOf(fromSquare), b = worldOf(toSquare)
      const direction = new THREE.Vector3(b.x - a.x, 0, b.z - a.z).normalize()
      physics.knock(piece, direction)
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

  function promote(piece, type) {
    piece.geometry = geometries[type]
    piece.userData.type = type
    piece.name = piece.name.replace('pawn', type)
    physics.reshape(piece)
  }

  /** Start over: fresh rules, fresh pieces, fresh bodies. */
  function reset() {
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
    refreshDraggable()
    if (settings.followTurn) camera.flyToSide('light')
  }

  // ---- start up -----------------------------------------------------------

  for (const piece of pieces.children) physics.addPiece(piece)
  physics.onImpact((_mesh, speed) => { if (speed > 0.8) sound.hit(speed / 8) })

  window.addEventListener('keydown', (event) => {
    if (event.key === 'n' || event.key === 'N') reset()
  })

  index()
  refreshDraggable()
  if (settings.followTurn) camera.flyToSide('light')
  return { onPickUp, onCarry, onDrop, onHover, reset }
}

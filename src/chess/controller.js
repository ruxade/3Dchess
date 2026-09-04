// Glue between the rules and the 3D pieces.
//
// The rules decide what is legal. This file makes the meshes agree with the
// rules: move the piece, slide a captured piece to the graveyard, move the
// castling rook, swap a promoted pawn for a queen. It also decides which
// pieces may be picked up (only the side to move, only while the game is on).

import { gsap } from 'gsap'
import { DRAG, GRAVEYARD } from '../config.js'
import { nameToSquare, squareName, squareToWorld } from './coords.js'
import { createPieceSet } from '../scene/pieces.js'

export function createGameController({ rules, pieces, geometries, materials, highlights, status, dragControls }) {
  const bySquare = new Map()          // 'e2' -> mesh
  const captured = { light: 0, dark: 0 }

  function index() {
    bySquare.clear()
    for (const piece of pieces.children) {
      const { col, row } = piece.userData
      bySquare.set(squareName(col, row), piece)
    }
  }

  /** Only the side to move can be grabbed. Nobody can once the game is over. */
  function refreshDraggable() {
    const state = rules.status()
    const side = state.turn
    dragControls.objects = state.gameOver
      ? []
      : pieces.children.filter((p) => p.userData.colour === side && !p.userData.captured)
    status.fromRules(state)
  }

  let legalTargets = new Set()

  /** drag.js calls this when a piece is lifted. */
  function onPickUp(piece) {
    const from = squareName(piece.userData.col, piece.userData.row)
    const moves = rules.legalMoves(from)
    legalTargets = new Set(moves.map((m) => m.to))
    highlights.show(from, moves)
  }

  /** drag.js calls this every time the carried piece crosses a square. */
  function onCarry(piece, { col, row }) {
    const square = squareName(col, row)
    highlights.setTarget(square, legalTargets.has(square))
  }

  /** drag.js calls this when a piece is released over a square. */
  function onDrop(piece, { col, row }) {
    highlights.clear()
    const from = squareName(piece.userData.col, piece.userData.row)
    const to = squareName(col, row)
    const result = rules.move(from, to)

    if (!result) {
      flyTo(piece, from, DRAG.returnSeconds)   // illegal: back where it came from
      return false
    }

    if (result.captured) capture(bySquare.get(result.captured.square))
    settle(piece, to)
    if (result.castle) flyTo(bySquare.get(result.castle.from), result.castle.to, DRAG.returnSeconds)
    if (result.promotion) promote(piece, result.promotion)

    index()
    refreshDraggable()
    return true
  }

  // ---- movements ----------------------------------------------------------

  /** The carried piece is already over the square: drop it the last bit. */
  function settle(piece, square) {
    const { col, row } = nameToSquare(square)
    const { x, z } = squareToWorld(col, row)
    piece.userData.col = col
    piece.userData.row = row
    gsap.to(piece.position, { x, y: 0, z, duration: DRAG.snapSeconds, ease: 'power2.out' })
  }

  /** Lift, travel, land. Used for bounce-backs and the castling rook. */
  function flyTo(piece, square, seconds) {
    const { col, row } = nameToSquare(square)
    const { x, z } = squareToWorld(col, row)
    piece.userData.col = col
    piece.userData.row = row
    gsap.timeline()
      .to(piece.position, { y: DRAG.liftHeight * 0.5, duration: seconds * 0.3, ease: 'power2.out' })
      .to(piece.position, { x, z, duration: seconds * 0.5, ease: 'power2.inOut' }, '<')
      .to(piece.position, { y: 0, duration: seconds * 0.3, ease: 'bounce.out' })
  }

  /** Slide a taken piece off the board into the next free graveyard slot. */
  function capture(piece) {
    const colour = piece.userData.colour
    const n = captured[colour]++
    const side = colour === 'light' ? 1 : -1
    const x = side * (GRAVEYARD.firstColumnX + Math.floor(n / GRAVEYARD.perColumn) * GRAVEYARD.columnGap)
    const z = (n % GRAVEYARD.perColumn) - GRAVEYARD.perColumn / 2 + 0.5
    piece.userData.captured = true
    piece.userData.col = -1
    piece.userData.row = -1
    gsap.timeline()
      .to(piece.position, { y: DRAG.liftHeight * 0.4, duration: 0.2, ease: 'power2.out' })
      .to(piece.position, { x, z, duration: 0.6, ease: 'power2.inOut' }, '<0.05')
      .to(piece.position, { y: 0, duration: 0.25, ease: 'bounce.out' })
  }

  function promote(piece, type) {
    piece.geometry = geometries[type]
    piece.userData.type = type
    piece.name = piece.name.replace('pawn', type)
  }

  /** Start over: fresh rules, fresh pieces. */
  function reset() {
    rules.reset()
    highlights.clear()
    gsap.killTweensOf(pieces.children.map((p) => p.position))
    pieces.clear()
    createPieceSet(geometries, materials, pieces)
    captured.light = 0
    captured.dark = 0
    index()
    refreshDraggable()
  }

  window.addEventListener('keydown', (event) => {
    if (event.key === 'n' || event.key === 'N') reset()
  })

  index()
  refreshDraggable()
  return { onPickUp, onCarry, onDrop, reset }
}

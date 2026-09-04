// Translate between chess squares and world positions.
//
// World axes: x runs along the files (a to h), z runs along the ranks (1 to 8),
// y is up. The board is centred on the origin and the *top* of the squares is
// at y = 0, so a piece standing on the board has position.y = 0.
//
//        col 0 (file a)          col 7 (file h)
//  row 7 (rank 8)  x = -3.5 ..............  x = +3.5   z = +3.5
//  row 0 (rank 1)  x = -3.5 ..............  x = +3.5   z = -3.5

import { BOARD } from '../config.js'

const FILES = 'abcdefgh'
const half = (BOARD.size * BOARD.squareSize) / 2

/** Centre of a square in world space. col and row are integers 0 to 7. */
export function squareToWorld(col, row) {
  return {
    x: (col + 0.5) * BOARD.squareSize - half,
    y: 0,
    z: (row + 0.5) * BOARD.squareSize - half
  }
}

/** Nearest square to a world position, clamped so it is always on the board. */
export function worldToSquare(x, z) {
  const col = Math.floor((x + half) / BOARD.squareSize)
  const row = Math.floor((z + half) / BOARD.squareSize)
  return { col: clamp(col), row: clamp(row) }
}

/** 'e4' style name, handy for logging and later for real chess rules. */
export function squareName(col, row) {
  return `${FILES[col]}${row + 1}`
}

export function isDarkSquare(col, row) {
  return (col + row) % 2 === 0   // a1 (0, 0) is dark, as on a real board
}

function clamp(n) {
  return Math.min(BOARD.size - 1, Math.max(0, n))
}

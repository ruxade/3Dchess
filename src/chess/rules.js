// The rules of chess, wrapped so the rest of the app never sees chess.js.
//
// chess.js knows every rule (castling, en passant, promotion, check, draws).
// We translate its vocabulary into ours: 'w'/'b' become 'light'/'dark',
// 'n' becomes 'knight', and a Move becomes a plain description of what the 3D
// side has to do: move this, remove that, also move the rook, swap to a queen.

import { Chess } from 'chess.js'

const COLOUR = { w: 'light', b: 'dark' }
const TYPE = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' }

export function createRules(fen) {
  const chess = fen ? new Chess(fen) : new Chess()

  /** 'light' or 'dark': who moves next. */
  function turn() {
    return COLOUR[chess.turn()]
  }

  /** What stands on a square, or null. */
  function pieceAt(square) {
    const piece = chess.get(square)
    return piece ? { type: TYPE[piece.type], colour: COLOUR[piece.color] } : null
  }

  /** Every legal destination from a square: [{ to: 'e4', capture: false }, ...] */
  function legalMoves(square) {
    return chess.moves({ square, verbose: true }).map((m) => ({
      to: m.to,
      capture: m.flags.includes('c') || m.flags.includes('e')
    }))
  }

  /**
   * Try a move. Returns null if illegal, otherwise a description:
   * { from, to, colour, captured: { square } | null, castle: { from, to } | null, promotion: 'queen' | null }
   * Pawns reaching the last rank always become queens (good enough for now).
   */
  function move(from, to) {
    let m
    try {
      m = chess.move({ from, to, promotion: 'q' })
    } catch {
      return null
    }
    const rank = m.to[1]
    return {
      from: m.from,
      to: m.to,
      colour: COLOUR[m.color],
      // en passant removes the pawn beside the destination, not the pawn on it
      captured: m.flags.includes('e') ? { square: m.to[0] + m.from[1] }
              : m.flags.includes('c') ? { square: m.to }
              : null,
      castle: m.flags.includes('k') ? { from: 'h' + rank, to: 'f' + rank }
            : m.flags.includes('q') ? { from: 'a' + rank, to: 'd' + rank }
            : null,
      promotion: m.promotion ? TYPE[m.promotion] : null
    }
  }

  function status() {
    return {
      turn: turn(),
      check: chess.isCheck(),
      checkmate: chess.isCheckmate(),
      stalemate: chess.isStalemate(),
      draw: chess.isDraw(),
      gameOver: chess.isGameOver()
    }
  }

  return { turn, pieceAt, legalMoves, move, status, reset: () => chess.reset(), fen: () => chess.fen() }
}

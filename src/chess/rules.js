// The rules of chess, wrapped so the rest of the app never sees chess.js.
//
// chess.js knows every rule (castling, en passant, promotion, check, draws).
// We translate its vocabulary into ours: 'w'/'b' become 'light'/'dark',
// 'n' becomes 'knight', and a Move becomes a plain description of what the 3D
// side has to do: move this, remove that, also move the rook, swap to a queen.

import { Chess } from 'chess.js'

const COLOUR = { w: 'light', b: 'dark' }
const TYPE = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' }
const LETTER = { pawn: 'p', knight: 'n', bishop: 'b', rook: 'r', queen: 'q', king: 'k' }

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

  /** Every piece on the board: [{ square, type, colour }]. */
  function pieces() {
    const out = []
    for (const row of chess.board()) {
      for (const cell of row) if (cell) out.push({ square: cell.square, type: TYPE[cell.type], colour: COLOUR[cell.color] })
    }
    return out
  }

  /** Every legal destination from a square: [{ to: 'e4', capture: false, promotion: false }, ...] */
  function legalMoves(square) {
    const seen = new Map()
    for (const m of chess.moves({ square, verbose: true })) {
      if (!seen.has(m.to)) seen.set(m.to, { to: m.to, capture: m.flags.includes('c') || m.flags.includes('e'), promotion: m.flags.includes('p') })
    }
    return [...seen.values()]
  }

  /**
   * Try a move. Returns null if illegal, otherwise a description:
   * { from, to, colour, san, captured: { square } | null, castle: { from, to } | null, promotion: 'queen' | null }
   * `promotion` names the piece a pawn becomes on the last rank (default queen).
   */
  function move(from, to, promotion = 'queen') {
    let m
    try {
      m = chess.move({ from, to, promotion: LETTER[promotion] || 'q' })
    } catch {
      return null
    }
    return describe(m)
  }

  function describe(m) {
    const rank = m.to[1]
    return {
      from: m.from,
      to: m.to,
      colour: COLOUR[m.color],
      san: m.san,
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

  /** Take the last move back. Returns its description, or null if there is none. */
  function undo() {
    const m = chess.undo()
    return m ? describe(m) : null
  }

  /** Moves so far in algebraic notation: ['e4', 'e5', 'Nf3', ...] */
  function history() {
    return chess.history()
  }

  /** The whole game as PGN text, the standard way to write a game down. Used to save it. */
  function pgn() {
    return chess.pgn()
  }

  /**
   * Replace the current game with one written as PGN. Returns false, and
   * changes nothing, if the text does not parse. (chess.js would leave the
   * game half loaded, so we try it on a scratch board first.)
   */
  function loadPgn(text) {
    try {
      new Chess().loadPgn(text)
    } catch {
      return false
    }
    chess.loadPgn(text)
    return true
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

  return {
    turn, pieceAt, pieces, legalMoves, move, undo, history, pgn, loadPgn, status,
    reset: () => chess.reset(),
    load: (nextFen) => chess.load(nextFen),
    fen: () => chess.fen()
  }
}

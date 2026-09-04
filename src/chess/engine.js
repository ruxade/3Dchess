// The computer opponent. No neural network, only rules and arithmetic.
// Pure functions on a FEN string, so this file runs in a Web Worker and in tests.
//
// Three levels:
//   beginner  a random legal move, with a soft spot for captures
//   casual    looks one move ahead: what do I win, what can they take back
//   club      alpha-beta search a few moves deep with a positional evaluation
//
// Scores are in centipawns: a pawn is 100, and positive is good for the side
// whose turn it is (negamax convention).

import { Chess } from 'chess.js'

export const VALUE = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 }
const MATE = 100000

/** Small positional bonus per piece type, from how close a square is to the centre. */
function squareBonus(type, square, color) {
  const file = square.charCodeAt(0) - 97
  const rank = Number(square[1]) - 1
  const centre = 3.5 - Math.max(Math.abs(file - 3.5), Math.abs(rank - 3.5))   // 0 at the edge, 3.5 in the middle
  switch (type) {
    case 'p': return (color === 'w' ? rank - 1 : 6 - rank) * 6 + centre * 2   // pawns like to advance
    case 'n': return centre * 12
    case 'b': return centre * 6
    case 'r': return centre * 2
    case 'q': return centre * 3
    case 'k': return -centre * 6                                             // kings like the edge (until the endgame)
    default: return 0
  }
}

/** Material plus position, from the point of view of the side to move. */
export function evaluate(chess) {
  let score = 0
  for (const row of chess.board()) {
    for (const cell of row) {
      if (!cell) continue
      const value = VALUE[cell.type] + squareBonus(cell.type, cell.square, cell.color)
      score += cell.color === chess.turn() ? value : -value
    }
  }
  return score
}

/** Captures first, biggest victim first: makes alpha-beta prune far more. */
function ordered(moves) {
  return moves.sort((a, b) => (VALUE[b.captured] || 0) - (VALUE[a.captured] || 0))
}

/** Negamax with alpha-beta pruning. `deadline` is a performance.now() timestamp. */
function search(chess, depth, alpha, beta, deadline, stats) {
  stats.nodes++
  if (chess.isCheckmate()) return -MATE - depth   // deeper mates score a little worse: prefer the quick one
  if (chess.isDraw()) return 0
  if (depth === 0) return quiesce(chess, alpha, beta, 2, stats)

  let best = -Infinity
  for (const m of ordered(chess.moves({ verbose: true }))) {
    chess.move(m)
    const score = -search(chess, depth - 1, -beta, -alpha, deadline, stats)
    chess.undo()
    if (score > best) best = score
    if (best > alpha) alpha = best
    if (alpha >= beta) break
    if (stats.nodes % 256 === 0 && performance.now() > deadline) { stats.timedOut = true; break }
  }
  return best
}

/** At the horizon, keep resolving captures so we do not stop mid-exchange. */
function quiesce(chess, alpha, beta, depthLeft, stats) {
  stats.nodes++
  const stand = evaluate(chess)
  if (depthLeft === 0 || stand >= beta) return stand
  if (stand > alpha) alpha = stand
  for (const m of ordered(chess.moves({ verbose: true }).filter((x) => x.captured))) {
    chess.move(m)
    const score = -quiesce(chess, -beta, -alpha, depthLeft - 1, stats)
    chess.undo()
    if (score >= beta) return score
    if (score > alpha) alpha = score
  }
  return alpha
}

const pick = (list) => list[Math.floor(Math.random() * list.length)]
const strip = (m) => ({ from: m.from, to: m.to, promotion: m.promotion === 'q' ? 'queen' : m.promotion === 'r' ? 'rook' : m.promotion === 'b' ? 'bishop' : m.promotion === 'n' ? 'knight' : undefined })

function beginner(chess) {
  const moves = chess.moves({ verbose: true })
  const captures = moves.filter((m) => m.captured)
  return captures.length && Math.random() < 0.5 ? pick(captures) : pick(moves)
}

function casual(chess) {
  let best = []
  let bestScore = -Infinity
  for (const m of chess.moves({ verbose: true })) {
    chess.move(m)
    let score = (VALUE[m.captured] || 0) + (m.promotion ? VALUE[m.promotion] - 100 : 0) + (chess.isCheck() ? 30 : 0)
    if (chess.isCheckmate()) score += MATE
    // What is the worst they can do straight back? Mostly: take the piece I just moved.
    let threat = 0
    for (const r of chess.moves({ verbose: true })) {
      if (r.captured) threat = Math.max(threat, VALUE[r.captured])
    }
    score -= threat * 0.9
    chess.undo()
    score += Math.random() * 20   // a little variety, so it does not always play the same game
    if (score > bestScore + 1e-9) { bestScore = score; best = [m] }
    else if (Math.abs(score - bestScore) < 1e-9) best.push(m)
  }
  return pick(best)
}

function club(chess, budgetMs) {
  const deadline = performance.now() + budgetMs
  const moves = ordered(chess.moves({ verbose: true }))
  let bestMove = moves[0]
  // Iterative deepening: finish depth 1, then 2, then 3... until time runs out.
  for (let depth = 1; depth <= 4; depth++) {
    const stats = { nodes: 0, timedOut: false }
    let bestScore = -Infinity
    let candidate = bestMove
    for (const m of moves) {
      chess.move(m)
      const score = -search(chess, depth - 1, -Infinity, Infinity, deadline, stats)
      chess.undo()
      if (score > bestScore) { bestScore = score; candidate = m }
      if (stats.timedOut) break
    }
    if (stats.timedOut) break        // keep the last fully searched depth
    bestMove = candidate
    if (bestScore >= MATE) break      // found a mate, no need to look further
  }
  return bestMove
}

/**
 * Choose a move for the side to move in `fen`.
 * level: 'beginner' | 'casual' | 'club'. Returns { from, to, promotion? } or null when the game is over.
 */
export function chooseMove(fen, level, { budgetMs = 1500 } = {}) {
  const chess = new Chess(fen)
  if (chess.isGameOver()) return null
  const m = level === 'club' ? club(chess, budgetMs) : level === 'casual' ? casual(chess) : beginner(chess)
  return m ? strip(m) : null
}

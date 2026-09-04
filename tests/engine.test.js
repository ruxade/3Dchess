import { describe, it, expect } from 'vitest'
import { Chess } from 'chess.js'
import { chooseMove, evaluate } from '../src/chess/engine.js'

const isLegal = (fen, move) => { try { new Chess(fen).move(move); return true } catch { return false } }

describe('engine', () => {
  const start = new Chess().fen()

  it('beginner plays a legal move', () => {
    const move = chooseMove(start, 'beginner')
    expect(isLegal(start, { from: move.from, to: move.to })).toBe(true)
  })

  it('returns null when the game is over', () => {
    const mated = 'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3'
    expect(chooseMove(mated, 'club')).toBeNull()
  })

  it('casual takes a free queen', () => {
    const fen = '4k3/8/8/3q4/8/8/8/3RK3 w - - 0 1'
    expect(chooseMove(fen, 'casual')).toMatchObject({ from: 'd1', to: 'd5' })
  })

  it('casual does not hang its queen for a pawn', () => {
    // Qxb7 would be answered by ...Bxb7 style recapture: here the pawn on b7 is defended by the bishop c8
    const fen = 'rnbqkbnr/pppppppp/8/8/8/1Q6/PPPPPPPP/RNB1KBNR w KQkq - 0 1'
    const move = chooseMove(fen, 'casual')
    expect(move.to).not.toBe('b7')
  })

  it('club finds mate in one', () => {
    const fen = 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4'
    expect(chooseMove(fen, 'club', { budgetMs: 3000 })).toMatchObject({ from: 'h5', to: 'f7' })
  })

  it('evaluates material from the side to move', () => {
    const chess = new Chess('4k3/8/8/8/8/8/8/3QK3 w - - 0 1')
    expect(evaluate(chess)).toBeGreaterThan(800)
    chess.load('4k3/8/8/8/8/8/8/3QK3 b - - 0 1')
    expect(evaluate(chess)).toBeLessThan(-800)
  })
})

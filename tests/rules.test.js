import { describe, it, expect } from 'vitest'
import { createRules } from '../src/chess/rules.js'

describe('rules', () => {
  it('starts with white, in our colour words', () => {
    const rules = createRules()
    expect(rules.turn()).toBe('light')
    expect(rules.pieceAt('e1')).toEqual({ type: 'king', colour: 'light' })
    expect(rules.pieceAt('e4')).toBeNull()
  })

  it('lists legal moves and flags captures', () => {
    const rules = createRules()
    expect(rules.legalMoves('e2').map((m) => m.to).sort()).toEqual(['e3', 'e4'])
    rules.move('e2', 'e4'); rules.move('d7', 'd5')
    expect(rules.legalMoves('e4')).toContainEqual({ to: 'd5', capture: true, promotion: false })
  })

  it('rejects illegal moves and keeps the turn', () => {
    const rules = createRules()
    expect(rules.move('e2', 'e5')).toBeNull()
    expect(rules.move('e7', 'e5')).toBeNull()   // black cannot move first
    expect(rules.turn()).toBe('light')
  })

  it('describes a plain capture', () => {
    const rules = createRules()
    rules.move('e2', 'e4'); rules.move('d7', 'd5')
    expect(rules.move('e4', 'd5')).toMatchObject({ from: 'e4', to: 'd5', colour: 'light', captured: { square: 'd5' }, castle: null, promotion: null })
  })

  it('points en passant at the pawn beside the destination', () => {
    const rules = createRules()
    rules.move('e2', 'e4'); rules.move('a7', 'a6'); rules.move('e4', 'e5'); rules.move('d7', 'd5')
    expect(rules.move('e5', 'd6')).toMatchObject({ captured: { square: 'd5' } })
  })

  it('tells us where the castling rook goes', () => {
    const rules = createRules()
    for (const [f, t] of [['e2', 'e4'], ['e7', 'e5'], ['g1', 'f3'], ['b8', 'c6'], ['f1', 'c4'], ['f8', 'c5']]) rules.move(f, t)
    expect(rules.move('e1', 'g1')).toMatchObject({ castle: { from: 'h1', to: 'f1' } })
  })

  it('promotes to a queen by default, or to what you ask for', () => {
    const rules = createRules('8/P7/8/8/8/8/8/k6K w - - 0 1')
    expect(rules.legalMoves('a7')).toEqual([{ to: 'a8', capture: false, promotion: true }])
    expect(rules.move('a7', 'a8')).toMatchObject({ promotion: 'queen' })
    expect(rules.pieceAt('a8')).toEqual({ type: 'queen', colour: 'light' })
    rules.undo()
    expect(rules.move('a7', 'a8', 'knight')).toMatchObject({ promotion: 'knight' })
  })

  it('undoes and lists history', () => {
    const rules = createRules()
    rules.move('e2', 'e4'); rules.move('e7', 'e5')
    expect(rules.history()).toEqual(['e4', 'e5'])
    expect(rules.undo()).toMatchObject({ from: 'e7', to: 'e5' })
    expect(rules.turn()).toBe('dark')
    expect(rules.pieces()).toHaveLength(32)
    expect(rules.pieceAt('e7')).toEqual({ type: 'pawn', colour: 'dark' })
  })

  it('saves a game as PGN and loads it back', () => {
    const rules = createRules()
    rules.move('e2', 'e4'); rules.move('e7', 'e5'); rules.move('g1', 'f3')
    const pgn = rules.pgn()
    const again = createRules()
    expect(again.loadPgn(pgn)).toBe(true)
    expect(again.history()).toEqual(['e4', 'e5', 'Nf3'])
    expect(again.turn()).toBe('dark')
    expect(again.fen()).toBe(rules.fen())
    expect(again.undo()).toMatchObject({ from: 'g1', to: 'f3' })   // history survives, so undo still works
  })

  it('refuses a broken PGN and keeps the current game', () => {
    const rules = createRules()
    rules.move('e2', 'e4')
    expect(rules.loadPgn('1. e4 e5 2. Qxz9')).toBe(false)
    expect(rules.history()).toEqual(['e4'])
  })

  it('reports checkmate', () => {
    const rules = createRules()
    for (const [f, t] of [['f2', 'f3'], ['e7', 'e5'], ['g2', 'g4']]) rules.move(f, t)
    rules.move('d8', 'h4')
    expect(rules.status()).toMatchObject({ checkmate: true, gameOver: true, turn: 'light' })
  })
})

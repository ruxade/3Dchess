import { describe, it, expect } from 'vitest'
import { squareToWorld, worldToSquare, squareName, nameToSquare, isDarkSquare } from '../src/chess/coords.js'

describe('coords', () => {
  it('puts a1 at the -x -z corner and h8 at +x +z', () => {
    expect(squareToWorld(0, 0)).toEqual({ x: -3.5, y: 0, z: -3.5 })
    expect(squareToWorld(7, 7)).toEqual({ x: 3.5, y: 0, z: 3.5 })
  })

  it('round-trips world to square, including off-centre drops', () => {
    expect(worldToSquare(-3.5, -3.5)).toEqual({ col: 0, row: 0 })
    expect(worldToSquare(0.4, -0.45)).toEqual({ col: 4, row: 3 })   // e4
    expect(worldToSquare(3.9, 3.9)).toEqual({ col: 7, row: 7 })
  })

  it('clamps drops that land off the board', () => {
    expect(worldToSquare(9, -9)).toEqual({ col: 7, row: 0 })
  })

  it('names squares like a chess player', () => {
    expect(squareName(4, 3)).toBe('e4')
    expect(nameToSquare('e4')).toEqual({ col: 4, row: 3 })
    expect(nameToSquare(squareName(0, 7))).toEqual({ col: 0, row: 7 })
  })

  it('makes a1 dark and h1 light', () => {
    expect(isDarkSquare(0, 0)).toBe(true)
    expect(isDarkSquare(7, 0)).toBe(false)
  })
})

// Runs the engine off the main thread so the 3D scene never stutters while
// the computer thinks. Messages in: { id, fen, level, budgetMs }. Out: { id, move }.

import { chooseMove } from './engine.js'

self.onmessage = ({ data }) => {
  const { id, fen, level, budgetMs } = data
  const move = chooseMove(fen, level, { budgetMs })
  self.postMessage({ id, move })
}

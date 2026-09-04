// The main-thread side of the computer opponent: asks the worker for a move
// and resolves a Promise with it. Falls back to running the engine inline
// where Workers are unavailable (tests).

import { OPPONENT } from '../config.js'
import { chooseMove } from './engine.js'

export function createOpponent() {
  let worker = null
  let nextId = 1
  const pending = new Map()

  try {
    worker = new Worker(new URL('./engine.worker.js', import.meta.url), { type: 'module' })
    worker.onmessage = ({ data }) => {
      const resolve = pending.get(data.id)
      pending.delete(data.id)
      resolve?.(data.move)
    }
  } catch {
    worker = null
  }

  /** Resolves with { from, to, promotion? } after at least OPPONENT.minReplyMs. */
  function think(fen, level) {
    const budgetMs = OPPONENT.thinkBudgetMs[level] ?? 0
    const started = performance.now()
    const answer = worker
      ? new Promise((resolve) => { const id = nextId++; pending.set(id, resolve); worker.postMessage({ id, fen, level, budgetMs }) })
      : Promise.resolve(chooseMove(fen, level, { budgetMs }))
    return answer.then((move) => new Promise((resolve) => {
      const wait = Math.max(0, OPPONENT.minReplyMs - (performance.now() - started))
      setTimeout(() => resolve(move), wait)
    }))
  }

  return { think }
}

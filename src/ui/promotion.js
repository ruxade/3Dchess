// "Your pawn reached the last rank: what does it become?"
// Four chips, keys Q R B N, Escape cancels the move.

import { PROMOTION_CHOICES, PIECE_INFO } from '../config.js'

export function createPromotionUi() {
  const panel = document.querySelector('.promotion')
  panel.innerHTML = `
    <header><span>Promote to</span></header>
    <div class="promotion-choices">${PROMOTION_CHOICES.map((t) => `<button class="chip" data-type="${t}">${PIECE_INFO[t].name}</button>`).join('')}</div>`

  let resolve = null

  panel.addEventListener('click', (event) => {
    const chip = event.target.closest('.chip')
    if (chip) finish(chip.dataset.type)
  })

  window.addEventListener('keydown', (event) => {
    if (!resolve) return
    const key = { q: 'queen', r: 'rook', b: 'bishop', n: 'knight' }[event.key.toLowerCase()]
    if (key) finish(key)
    if (event.key === 'Escape') finish(null)
  })

  function finish(choice) {
    panel.hidden = true
    const done = resolve
    resolve = null
    done?.(choice)
  }

  /** Resolves with a piece type, or null if cancelled. */
  function ask() {
    panel.hidden = false
    return new Promise((r) => { resolve = r })
  }

  return { ask, isOpen: () => resolve !== null }
}

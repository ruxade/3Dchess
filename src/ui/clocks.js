// The two chess clocks, top centre. Hidden when no clock is set. The side on
// the clock is lit; under twenty seconds it turns orange; a flagged side stays orange.

import { formatClock } from '../chess/clock.js'
import { CLOCK } from '../config.js'

export function createClocksUi() {
  const root = document.querySelector('.clocks')
  root.innerHTML = ['light', 'dark'].map((side) =>
    `<div class="clock" data-side="${side}"><span class="who">${side === 'light' ? 'White' : 'Black'}</span><span class="time"></span></div>`
  ).join('')
  const face = {}
  for (const side of ['light', 'dark']) {
    const el = root.querySelector(`[data-side="${side}"]`)
    face[side] = { el, time: el.querySelector('.time'), text: '' }
  }

  /** Call every frame with the live clock, or null to hide the panel. Only touches the DOM when the text changes. */
  function render(clock) {
    root.hidden = !clock
    if (!clock) return
    for (const side of ['light', 'dark']) {
      const ms = clock.remaining(side)
      const text = formatClock(ms)
      const f = face[side]
      if (text !== f.text) { f.time.textContent = text; f.text = text }
      f.el.classList.toggle('active', clock.running() === side)
      f.el.classList.toggle('low', ms < CLOCK.lowSeconds * 1000)
      f.el.classList.toggle('flagged', clock.flagged() === side)
    }
  }

  render(null)
  return { render }
}

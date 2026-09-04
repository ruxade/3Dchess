// The gallery's DOM: a bar with the six piece names, arrows, a caption, and a
// way back to the game. Keys: G toggles, left/right browse, Escape returns.

import { GALLERY, PIECE_INFO } from '../config.js'

export function createGalleryUi({ gallery, views }) {
  const bar = document.querySelector('.gallery-bar')
  const button = document.querySelector('.fab-gallery')

  bar.innerHTML = `
    <div class="gallery-caption">
      <h2 class="gallery-name"></h2>
      <p class="gallery-line"></p>
      <p class="gallery-stats"></p>
    </div>
    <div class="gallery-nav">
      <button class="arrow" data-step="-1" aria-label="Previous piece">‹</button>
      <div class="gallery-chips">${GALLERY.order.map((t) => `<button class="chip" data-type="${t}">${PIECE_INFO[t].name}</button>`).join('')}</div>
      <button class="arrow" data-step="1" aria-label="Next piece">›</button>
      <button class="back">Back to game</button>
    </div>`

  const name = bar.querySelector('.gallery-name')
  const line = bar.querySelector('.gallery-line')
  const stats = bar.querySelector('.gallery-stats')

  function render(facts) {
    const type = gallery.current()
    name.textContent = PIECE_INFO[type].name
    line.textContent = PIECE_INFO[type].line
    stats.textContent = facts
      ? `${facts.height.toFixed(2)} squares tall, ${Math.round(facts.triangles).toLocaleString()} triangles`
      : ''
    for (const chip of bar.querySelectorAll('.chip')) chip.classList.toggle('active', chip.dataset.type === type)
  }

  bar.addEventListener('click', (event) => {
    const chip = event.target.closest('.chip')
    const arrow = event.target.closest('.arrow')
    if (chip) render(gallery.show(chip.dataset.type))
    if (arrow) render(gallery.step(Number(arrow.dataset.step)))
    if (event.target.closest('.back')) views.select('game')
  })

  button.addEventListener('click', () => views.select(views.state.mode === 'gallery' ? 'game' : 'gallery'))

  window.addEventListener('keydown', (event) => {
    if (event.key === 'g' || event.key === 'G') views.select(views.state.mode === 'gallery' ? 'game' : 'gallery')
    if (views.state.mode !== 'gallery') return
    if (event.key === 'ArrowRight') render(gallery.step(1))
    if (event.key === 'ArrowLeft') render(gallery.step(-1))
    if (event.key === 'Escape') views.select('game')
  })

  /** Refresh the caption (call when entering the gallery or after geometries load). */
  return { render: () => render(gallery.show(gallery.current())) }
}

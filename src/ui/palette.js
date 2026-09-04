// The colour panel: pick a surface, pick a matcap, done. Presets apply a whole
// look at once. Your choice is saved in localStorage and restored next visit.
// Key P opens and closes it.

import { MATCAP_IDS, MATERIAL_SLOTS, PALETTES, PALETTE_STORAGE_KEY, matcapUrl } from '../config.js'

/** Read the saved palette (or null). Called before materials are created. */
export function loadSavedPalette() {
  try {
    return JSON.parse(localStorage.getItem(PALETTE_STORAGE_KEY))
  } catch {
    return null
  }
}

function save(palette) {
  try { localStorage.setItem(PALETTE_STORAGE_KEY, JSON.stringify(palette)) } catch { /* private mode, ignore */ }
}

export function createPalette(materials) {
  const panel = document.querySelector('.palette')
  const button = document.querySelector('.fab-palette')
  let palette = materials.getPalette()
  let activeSlot = 'lightPieces'

  // ---- build the DOM once ----
  panel.innerHTML = `
    <header><span>Colours</span><button class="close" aria-label="Close">×</button></header>
    <div class="presets">${Object.keys(PALETTES).map((n) => `<button data-preset="${n}">${n}</button>`).join('')}</div>
    <div class="slots">${Object.entries(MATERIAL_SLOTS).map(([slot, label]) => `
      <button class="slot" data-slot="${slot}"><img alt=""><span>${label}</span></button>`).join('')}</div>
    <div class="swatches">${MATCAP_IDS.map((id) => `
      <button class="swatch" data-id="${id}" title="${id}"><img src="${matcapUrl(id)}" alt="matcap ${id}" loading="lazy"></button>`).join('')}</div>`

  const slotButtons = [...panel.querySelectorAll('.slot')]
  const swatchButtons = [...panel.querySelectorAll('.swatch')]

  function render() {
    for (const el of slotButtons) {
      const slot = el.dataset.slot
      el.querySelector('img').src = matcapUrl(palette[slot])
      el.classList.toggle('active', slot === activeSlot)
    }
    for (const el of swatchButtons) {
      el.classList.toggle('active', Number(el.dataset.id) === palette[activeSlot])
    }
    for (const el of panel.querySelectorAll('[data-preset]')) {
      const preset = PALETTES[el.dataset.preset]
      el.classList.toggle('active', Object.keys(preset).every((k) => preset[k] === palette[k]))
    }
  }

  // ---- events ----
  panel.addEventListener('click', (event) => {
    const slot = event.target.closest('.slot')
    const swatch = event.target.closest('.swatch')
    const preset = event.target.closest('[data-preset]')
    if (slot) activeSlot = slot.dataset.slot
    if (swatch) palette = materials.setMatcap(activeSlot, Number(swatch.dataset.id))
    if (preset) palette = materials.applyPalette(PALETTES[preset.dataset.preset])
    if (event.target.closest('.close')) toggle(false)
    if (swatch || preset) save(palette)
    render()
  })

  function toggle(force) {
    const open = force ?? panel.hidden
    panel.hidden = !open
    button.classList.toggle('active', open)
  }

  button.addEventListener('click', () => toggle())
  window.addEventListener('keydown', (event) => {
    if (event.key === 'p' || event.key === 'P') toggle()
  })

  render()
  return { toggle }
}

// Every recolourable surface, one MeshMatcapMaterial per slot.
// The palette panel calls setMatcap(slot, id) to swap the picture on a slot;
// the material object stays the same, so meshes update without being touched.
//
// The sky slot is special: whoever cares (main.js) can subscribe with onSky()
// and receives the matcap's average colour, so the fog can match the sky.

import * as THREE from 'three'
import { MATERIAL_SLOTS, PALETTES, DEFAULT_PALETTE, matcapUrl } from '../config.js'

export function createMaterials(textureLoader, initialPalette) {
  const palette = { ...PALETTES[DEFAULT_PALETTE], ...(initialPalette || {}) }
  const materials = {}
  const cache = new Map()
  const lateLoader = new THREE.TextureLoader()   // swaps after start-up skip the loading screen
  const skyListeners = new Set()

  const texture = (id, loader) => {
    if (!cache.has(id)) {
      const tex = loader.load(matcapUrl(id), () => {
        tex.userData.ready = true
        tex.userData.onReady?.forEach((fn) => fn())
      })
      tex.userData.onReady = []
      cache.set(id, tex)
    }
    return cache.get(id)
  }

  const whenReady = (tex, fn) => (tex.userData.ready ? fn() : tex.userData.onReady.push(fn))

  for (const slot of Object.keys(MATERIAL_SLOTS)) {
    materials[slot] = new THREE.MeshMatcapMaterial({ matcap: texture(palette[slot], textureLoader) })
  }

  function announceSky() {
    const tex = materials.sky.matcap
    whenReady(tex, () => {
      if (tex !== materials.sky.matcap) return   // changed again while loading
      const colour = averageColour(tex.image)
      skyListeners.forEach((fn) => fn(colour))
    })
  }

  /** Change one surface. Returns the new palette. */
  function setMatcap(slot, id) {
    palette[slot] = id
    materials[slot].matcap = texture(id, lateLoader)
    if (slot === 'sky') announceSky()
    return { ...palette }
  }

  /** Change every surface at once (a preset). */
  function applyPalette(next) {
    for (const [slot, id] of Object.entries(next)) if (materials[slot]) setMatcap(slot, id)
    return { ...palette }
  }

  /** fn(THREE.Color) whenever the sky matcap is ready or changes. */
  function onSky(fn) {
    skyListeners.add(fn)
    announceSky()
    return () => skyListeners.delete(fn)
  }

  return Object.assign(materials, { setMatcap, applyPalette, onSky, getPalette: () => ({ ...palette }) })
}

/** Average colour of the lit sphere in a matcap image (ignores the corners). */
function averageColour(image) {
  const size = 32
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  ctx.drawImage(image, 0, 0, size, size)
  const { data } = ctx.getImageData(0, 0, size, size)
  let r = 0, g = 0, b = 0, n = 0
  const c = (size - 1) / 2, radius = size * 0.42
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if ((x - c) ** 2 + (y - c) ** 2 > radius * radius) continue
      const i = (y * size + x) * 4
      r += data[i]; g += data[i + 1]; b += data[i + 2]; n++
    }
  }
  return new THREE.Color(r / n / 255, g / n / 255, b / n / 255)
}

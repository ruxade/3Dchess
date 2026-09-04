// Every recolourable surface, one MeshMatcapMaterial per slot.
// The palette panel calls setMatcap(slot, id) to swap the picture on a slot;
// the material object stays the same, so meshes update without being touched.

import * as THREE from 'three'
import { MATERIAL_SLOTS, PALETTES, DEFAULT_PALETTE, matcapUrl } from '../config.js'

export function createMaterials(textureLoader, initialPalette) {
  const palette = { ...PALETTES[DEFAULT_PALETTE], ...(initialPalette || {}) }
  const materials = {}
  const cache = new Map()
  const lateLoader = new THREE.TextureLoader()   // swaps after start-up skip the loading screen

  const texture = (id, loader) => {
    if (!cache.has(id)) cache.set(id, loader.load(matcapUrl(id)))
    return cache.get(id)
  }

  for (const slot of Object.keys(MATERIAL_SLOTS)) {
    materials[slot] = new THREE.MeshMatcapMaterial({ matcap: texture(palette[slot], textureLoader) })
  }

  /** Change one surface. Returns the new palette. */
  function setMatcap(slot, id) {
    palette[slot] = id
    materials[slot].matcap = texture(id, lateLoader)
    return { ...palette }
  }

  /** Change every surface at once (a preset). */
  function applyPalette(next) {
    for (const [slot, id] of Object.entries(next)) if (materials[slot]) setMatcap(slot, id)
    return { ...palette }
  }

  return Object.assign(materials, { setMatcap, applyPalette, getPalette: () => ({ ...palette }) })
}

// All materials in one place so the whole look can be changed from here.
// Every material is a MeshMatcapMaterial: unlit, shading comes from the image.

import * as THREE from 'three'
import { MATCAPS } from '../config.js'

export function createMaterials(textureLoader) {
  const matcap = (path) => new THREE.MeshMatcapMaterial({ matcap: textureLoader.load(path) })

  const light = matcap(MATCAPS.light)
  const dark = matcap(MATCAPS.dark)
  const plate = matcap(MATCAPS.plate)
  const background = matcap(MATCAPS.background)
  const display = matcap(MATCAPS.display)

  // NearestFilter stops the GPU blending between matcap pixels when zoomed in,
  // which gives these two a slightly crunchier, more graphic shading.
  // Delete these two lines to see the smooth version.
  dark.matcap.magFilter = THREE.NearestFilter
  plate.matcap.magFilter = THREE.NearestFilter

  return { light, dark, plate, background, display }
}

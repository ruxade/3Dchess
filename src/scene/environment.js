// Everything that is "around" the board: the sky sphere and the fog.

import * as THREE from 'three'
import { FOG, WORLD_RADIUS } from '../config.js'

export function createEnvironment(scene, materials) {
  scene.add(createSkySphere(WORLD_RADIUS, materials.sky))

  // FogExp2 fades geometry towards one colour as it gets further from the
  // camera. Density is the only control: bigger means thicker fog.
  scene.fog = new THREE.FogExp2(FOG.color, FOG.density)
}

/**
 * A sphere we sit inside of. Scaling x by -1 turns it inside out, so its faces
 * point at the camera instead of away from it (faces pointing away are not drawn).
 */
export function createSkySphere(radius, material) {
  const geometry = new THREE.SphereGeometry(radius, 64, 32)
  geometry.scale(-1, 1, 1)
  const sky = new THREE.Mesh(geometry, material)
  sky.name = 'sky'
  return sky
}

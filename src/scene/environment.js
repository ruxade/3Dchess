// Everything that is "around" the board: the sky sphere and the fog, and the
// tint that falls over both (and the plate) when a game ends.

import * as THREE from 'three'
import { gsap } from 'gsap'
import { FOG, WORLD_RADIUS } from '../config.js'

export function createEnvironment(scene, materials) {
  scene.add(createSkySphere(WORLD_RADIUS, materials.sky))

  // FogExp2 fades geometry towards one colour as it gets further from the
  // camera. Density is the only control: bigger means thicker fog.
  scene.fog = new THREE.FogExp2(FOG.color, FOG.density)

  // The fog always matches the sky. The tint sits on top: white means none.
  const baseFog = new THREE.Color(FOG.color)
  const tint = new THREE.Color(1, 1, 1)
  const applyFog = () => scene.fog.color.copy(baseFog).multiply(tint)
  materials.onSky((colour) => { baseFog.copy(colour); applyFog() })

  /** Fade the sky, fog and plate towards a colour (a hex number), or back to white. */
  function setTint(hex, seconds) {
    const target = new THREE.Color(hex)
    gsap.killTweensOf(tint)
    gsap.to(tint, {
      r: target.r, g: target.g, b: target.b,
      duration: seconds,
      ease: 'power1.inOut',
      onUpdate: () => {
        materials.sky.color.copy(tint)
        materials.plate.color.copy(tint)
        applyFog()
      }
    })
  }

  return { setTint, clearTint: (seconds) => setTint(0xffffff, seconds) }
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

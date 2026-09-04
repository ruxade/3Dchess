// Little particle puffs: a burst of points that fly out, fall and fade.
// Used when a captured piece is knocked away and when it hits something hard.

import * as THREE from 'three'
import { EFFECTS } from '../config.js'

export function createEffects(scene) {
  const live = []
  const material = new THREE.PointsMaterial({
    color: EFFECTS.burstColour,
    size: 0.09,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  })

  /** Spawn a burst at a world position. */
  function burst(position, count = EFFECTS.burstCount) {
    const positions = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions.set([position.x, position.y, position.z], i * 3)
      const angle = Math.random() * Math.PI * 2
      const speed = 1.5 + Math.random() * 2.5
      velocities.set([Math.cos(angle) * speed, 1 + Math.random() * 3, Math.sin(angle) * speed], i * 3)
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const points = new THREE.Points(geometry, material.clone())
    scene.add(points)
    live.push({ points, velocities, age: 0 })
  }

  /** Call once per frame. */
  function update(dt) {
    for (let i = live.length - 1; i >= 0; i--) {
      const b = live[i]
      b.age += dt
      const p = b.points.geometry.attributes.position
      for (let j = 0; j < p.count; j++) {
        b.velocities[j * 3 + 1] -= 9.8 * dt * 0.6
        p.array[j * 3] += b.velocities[j * 3] * dt
        p.array[j * 3 + 1] += b.velocities[j * 3 + 1] * dt
        p.array[j * 3 + 2] += b.velocities[j * 3 + 2] * dt
      }
      p.needsUpdate = true
      b.points.material.opacity = Math.max(0, 1 - b.age / EFFECTS.burstLife)
      if (b.age >= EFFECTS.burstLife) {
        scene.remove(b.points)
        b.points.geometry.dispose()
        b.points.material.dispose()
        live.splice(i, 1)
      }
    }
  }

  return { burst, update }
}

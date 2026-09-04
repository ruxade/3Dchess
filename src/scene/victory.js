// The victory screen: the winning side's pawn spinning on a pedestal inside
// its own small sky, with particle puffs. Same ingredients as the gallery,
// but no orbit controls: the pawn turns by itself and the camera holds still.

import * as THREE from 'three'
import { gsap } from 'gsap'
import { GALLERY, VICTORY } from '../config.js'
import { createSkySphere } from './environment.js'
import { createEffects } from './effects.js'

export function createVictory(materials, sizes) {
  const scene = new THREE.Scene()
  scene.name = 'victory'
  scene.add(createSkySphere(GALLERY.sphereRadius, materials.sky))

  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.25, 0.18, 64), materials.plate)
  pedestal.position.y = -0.09
  scene.add(pedestal)

  const pawn = new THREE.Mesh(new THREE.BufferGeometry(), materials.lightPieces)
  pawn.name = 'victory-pawn'
  scene.add(pawn)

  const effects = createEffects(scene)
  const camera = new THREE.PerspectiveCamera(GALLERY.fov, sizes.width / sizes.height, 0.1, 100)
  let height = 1
  let sincePuff = 0

  /** Called once the geometries have loaded. */
  function populate(geometries) {
    pawn.geometry = geometries.pawn
    height = geometries.pawn.boundingBox.max.y
  }

  /** Put the winner's pawn on the pedestal and let it rise into view. 'light' or 'dark'. */
  function show(colour) {
    pawn.material = materials[`${colour}Pieces`]
    pawn.rotation.y = colour === 'dark' ? Math.PI : 0
    camera.position.set(0, height * VICTORY.camera.height, height * VICTORY.camera.distance + 1.2)
    camera.lookAt(0, height * 0.5, 0)
    gsap.killTweensOf(pawn.position)
    gsap.fromTo(pawn.position, { y: -height }, { y: 0, duration: 0.9, ease: 'back.out(1.6)' })
    sincePuff = VICTORY.burstEvery   // first puff straight away
  }

  /** Once per frame while the screen is showing. */
  function update(dt) {
    pawn.rotation.y += dt * VICTORY.spinSpeed
    sincePuff += dt
    if (sincePuff >= VICTORY.burstEvery) {
      sincePuff = 0
      const angle = Math.random() * Math.PI * 2
      const radius = 0.5 + Math.random() * 0.8
      effects.burst(new THREE.Vector3(Math.cos(angle) * radius, height * (0.3 + Math.random() * 0.7), Math.sin(angle) * radius), 18)
    }
    effects.update(dt)
  }

  const view = { scene, camera, postFx: false, update }

  return {
    view,
    populate,
    show,
    setAspect: (aspect) => { camera.aspect = aspect; camera.updateProjectionMatrix() }
  }
}

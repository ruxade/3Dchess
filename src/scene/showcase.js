// A second, tiny scene used by camera views 2 to 5: four pieces slowly
// spinning inside a small sky sphere, each with its own camera looking at it.
// It shares the piece geometries with the main scene, nothing is loaded twice.

import * as THREE from 'three'
import { gsap } from 'gsap'
import { CAMERA, SHOWCASE } from '../config.js'
import { createSkySphere } from './environment.js'

export function createShowcase(materials, sizes) {
  const scene = new THREE.Scene()
  scene.name = 'showcase'
  scene.add(createSkySphere(SHOWCASE.sphereRadius, materials.sky))
  scene.add(new THREE.AxesHelper(3))   // red x, green y, blue z: handy while learning

  // One camera per piece, all parked at the centre, each turned to face its piece.
  const cameras = {}
  for (const { key, position } of SHOWCASE.pieces) {
    const camera = new THREE.PerspectiveCamera(CAMERA.fov, sizes.width / sizes.height, CAMERA.near, CAMERA.far)
    camera.lookAt(position.x * 2, 0, position.z * 2)
    cameras[key] = camera
  }

  /** Called once the geometries have loaded. */
  function populate(geometries) {
    for (const { type, position } of SHOWCASE.pieces) {
      const piece = new THREE.Mesh(geometries[type], materials.display)
      piece.position.set(position.x, position.y, position.z)
      piece.name = `showcase-${type}`
      scene.add(piece)

      // Turntable: one full turn around y, forever, no easing.
      gsap.to(piece.rotation, { y: Math.PI * 2, duration: SHOWCASE.spinSeconds, repeat: -1, ease: 'none' })
    }
  }

  function setAspect(aspect) {
    for (const camera of Object.values(cameras)) {
      camera.aspect = aspect
      camera.updateProjectionMatrix()
    }
  }

  return { scene, cameras, populate, setAspect }
}

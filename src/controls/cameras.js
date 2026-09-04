// The main camera and its orbit controls.

import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { CAMERA, WORLD_RADIUS } from '../config.js'

export function createMainCamera(canvas, sizes) {
  const camera = new THREE.PerspectiveCamera(CAMERA.fov, sizes.width / sizes.height, CAMERA.near, CAMERA.far)
  camera.position.set(CAMERA.position.x, CAMERA.position.y, CAMERA.position.z)
  camera.lookAt(0, 0, 0)

  const controls = new OrbitControls(camera, canvas)
  controls.enableDamping = true          // eases to a stop instead of snapping
  controls.dampingFactor = 0.25
  controls.maxPolarAngle = Math.PI / 2   // never look up from under the board
  controls.maxDistance = WORLD_RADIUS - 1

  const centre = new THREE.Vector3(0, 0, 0)

  /** Call once per frame. Damping needs the update to keep moving. */
  function update() {
    controls.update()

    // Panning can still push the camera through the sky sphere: pull it back in.
    if (camera.position.length() > WORLD_RADIUS - 1) {
      camera.position.sub(centre).setLength(WORLD_RADIUS - 1).add(centre)
    }
    if (camera.position.y < 0) camera.position.y = 0
  }

  function setAspect(aspect) {
    camera.aspect = aspect
    camera.updateProjectionMatrix()
  }

  return { camera, controls, update, setAspect }
}

// The main camera and its orbit controls.

import * as THREE from 'three'
import { gsap } from 'gsap'
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

  /**
   * Glide the camera to a new spot, looking at the board centre. OrbitControls
   * is paused for the flight so its damping does not fight the tween.
   */
  function flyTo(position, seconds = CAMERA.flySeconds) {
    controls.enabled = false
    gsap.killTweensOf([camera.position, controls.target])
    gsap.to(controls.target, { x: 0, y: 0, z: 0, duration: seconds, ease: 'power2.inOut' })
    gsap.to(camera.position, {
      ...position,
      duration: seconds,
      ease: 'power2.inOut',
      onUpdate: () => camera.lookAt(controls.target),
      onComplete: () => { controls.enabled = true }
    })
  }

  /** Behind the player whose turn it is: 'light' or 'dark'. */
  function flyToSide(colour) {
    flyTo(CAMERA.sides[colour])
  }

  const view = { scene: null, camera, postFx: true }   // scene is filled in by main.js

  return { camera, controls, view, update, setAspect, flyTo, flyToSide }
}

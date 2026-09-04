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

  // A flight is tweened in orbit coordinates around the target (radius, phi
  // down from the zenith, theta around), so the camera swings round the board.
  // A straight line between the two sides would pass over the top, where
  // lookAt has no idea which way is up and the picture flips.
  const flight = { radius: 0, phi: 0, theta: 0, active: false }
  const spherical = new THREE.Spherical()
  const offset = new THREE.Vector3()

  function placeFromFlight() {
    spherical.set(flight.radius, flight.phi, flight.theta)
    camera.position.setFromSpherical(spherical).add(controls.target)
    camera.lookAt(controls.target)
  }

  /** Call once per frame. Damping needs the update to keep moving. */
  function update() {
    controls.update()                       // keeps running mid-flight so leftover momentum decays
    if (flight.active) placeFromFlight()    // then the flight has the last word

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
    gsap.killTweensOf([camera.position, controls.target, flight])

    const from = new THREE.Spherical().setFromVector3(offset.copy(camera.position).sub(controls.target))
    const to = new THREE.Spherical().setFromVector3(offset.set(position.x, position.y, position.z))   // relative to the board centre, where the target is heading
    // Go round the short way. Exactly opposite sides (the usual case) always
    // swing the same way round, so the camera circles the table like a spectator.
    let turn = to.theta - from.theta
    turn = Math.atan2(Math.sin(turn), Math.cos(turn))
    if (Math.abs(Math.abs(turn) - Math.PI) < 1e-3) turn = Math.PI

    Object.assign(flight, { radius: from.radius, phi: from.phi, theta: from.theta, active: true })
    gsap.to(controls.target, { x: 0, y: 0, z: 0, duration: seconds, ease: 'power2.inOut' })
    gsap.to(flight, {
      radius: to.radius, phi: to.phi, theta: from.theta + turn,
      duration: seconds,
      ease: 'power2.inOut',
      onUpdate: placeFromFlight,
      onComplete: () => { flight.active = false; controls.enabled = true }
    })
  }

  /** Behind the player whose turn it is: 'light' or 'dark'. */
  function flyToSide(colour, seconds = CAMERA.flySeconds) {
    flyTo(CAMERA.sides[colour], seconds)
  }

  const view = { scene: null, camera, postFx: true, update }   // scene is filled in by main.js

  return { camera, controls, view, update, setAspect, flyTo, flyToSide }
}

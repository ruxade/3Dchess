// Pick up a piece, carry it above the board, drop it on a square.
//
// DragControls does the pointer work: it raycasts to find the piece under the
// cursor and fires dragstart / drag / dragend. We ignore where it would put
// the piece and instead follow the cursor across a horizontal plane at the
// height you grabbed the piece, holding the piece up in the air so it never
// passes through its neighbours. The game controller decides what is legal.

import * as THREE from 'three'
import { DragControls } from 'three/addons/controls/DragControls.js'
import { DRAG } from '../config.js'
import { worldToSquare } from '../chess/coords.js'

export function createDragControls(camera, canvas, orbitControls) {
  const controls = new DragControls([], camera, canvas)   // the controller fills `objects`
  controls.recursive = false

  // Horizontal plane the cursor is projected onto. Its height is set on pick-up
  // to the point where you clicked the piece, so the piece does not jump and
  // moves exactly as far as the cursor does.
  const carryPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  const hit = new THREE.Vector3()
  const grabOffset = new THREE.Vector3()
  let handlers = { onPickUp() {}, onCarry() {}, onDrop() {}, onHover() {} }

  /** The game controller registers its onPickUp / onCarry / onDrop here. */
  function setHandlers(next) {
    handlers = { ...handlers, ...next }
  }

  function cursorOnPlane() {
    return controls.raycaster.ray.intersectPlane(carryPlane, hit)
  }

  controls.addEventListener('dragstart', ({ object }) => {
    orbitControls.enabled = false

    const [touch] = controls.raycaster.intersectObject(object, false)
    carryPlane.constant = touch ? -touch.point.y : 0    // plane: y = touch height
    if (cursorOnPlane()) grabOffset.copy(object.position).sub(hit).setY(0)
    else grabOffset.set(0, 0, 0)

    handlers.onPickUp(object)
  })

  controls.addEventListener('drag', ({ object }) => {
    if (!cursorOnPlane()) return
    object.position.set(hit.x + grabOffset.x, DRAG.liftHeight, hit.z + grabOffset.z)
    handlers.onCarry(object, worldToSquare(object.position.x, object.position.z))
  })

  controls.addEventListener('dragend', ({ object }) => {
    orbitControls.enabled = true
    handlers.onDrop(object, worldToSquare(object.position.x, object.position.z))
  })

  controls.addEventListener('hoveron', ({ object }) => {
    canvas.style.cursor = 'grab'
    handlers.onHover(object, true)
  })
  controls.addEventListener('hoveroff', ({ object }) => {
    canvas.style.cursor = ''
    handlers.onHover(object, false)
  })

  controls.setHandlers = setHandlers
  return controls
}

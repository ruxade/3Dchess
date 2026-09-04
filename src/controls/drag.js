// Click and drag a piece, release, it snaps to the nearest square.
//
// DragControls does the raycasting and moves the mesh on a plane facing the
// camera. We add the chess rules of movement: stay on the board surface while
// dragging, land on a square centre when released.

import { DragControls } from 'three/addons/controls/DragControls.js'
import { squareToWorld, worldToSquare, squareName } from '../chess/coords.js'

export function createDragControls(pieces, camera, canvas, orbitControls) {
  const controls = new DragControls(pieces.children, camera, canvas)
  controls.recursive = false   // pieces are single meshes, no need to search inside them

  controls.addEventListener('dragstart', () => {
    orbitControls.enabled = false   // otherwise the camera orbits while you drag
  })

  controls.addEventListener('drag', ({ object }) => {
    object.position.y = 0   // slide along the board, never lift off or sink
  })

  controls.addEventListener('dragend', ({ object }) => {
    orbitControls.enabled = true

    const { col, row } = worldToSquare(object.position.x, object.position.z)
    const { x, z } = squareToWorld(col, row)
    object.position.set(x, 0, z)

    // Keep the piece's own idea of where it stands in sync.
    object.userData.col = col
    object.userData.row = row
    console.log(`${object.userData.colour} ${object.userData.type} to ${squareName(col, row)}`)
  })

  controls.addEventListener('hoveron', () => { canvas.style.cursor = 'grab' })
  controls.addEventListener('hoveroff', () => { canvas.style.cursor = '' })

  return controls
}

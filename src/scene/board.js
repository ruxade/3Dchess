// The board: 64 chunky squares on top of a round plate, plus a thin white grid.
// Returns one Group so main.js can add it with a single scene.add().

import * as THREE from 'three'
import { BOARD, PLATE } from '../config.js'
import { squareToWorld, isDarkSquare, squareName } from '../chess/coords.js'

export function createBoard(materials) {
  const board = new THREE.Group()
  board.name = 'board'

  // Plate. Its top face sits flush with the bottom of the squares.
  const plateGeometry = new THREE.CylinderGeometry(
    PLATE.radiusTop, PLATE.radiusBottom, PLATE.height, 64, 1
  )
  const plate = new THREE.Mesh(plateGeometry, materials.plate)
  plate.name = 'plate'
  plate.position.y = -BOARD.squareHeight - PLATE.height / 2
  board.add(plate)

  // Squares. One shared geometry, two shared materials: 64 meshes but only
  // one copy of the vertex data on the GPU.
  const squareGeometry = new THREE.BoxGeometry(BOARD.squareSize, BOARD.squareHeight, BOARD.squareSize)
  for (let row = 0; row < BOARD.size; row++) {
    for (let col = 0; col < BOARD.size; col++) {
      const material = isDarkSquare(col, row) ? materials.darkSquares : materials.lightSquares
      const square = new THREE.Mesh(squareGeometry, material)
      const { x, z } = squareToWorld(col, row)
      square.position.set(x, -BOARD.squareHeight / 2, z)   // top face lands on y = 0
      square.name = `square-${squareName(col, row)}`
      square.userData = { col, row }
      board.add(square)
    }
  }

  // Grid lines exactly on the top surface, so square edges read from any angle.
  const grid = new THREE.GridHelper(BOARD.size * BOARD.squareSize, BOARD.size, 0xffffff, 0xffffff)
  grid.name = 'grid'
  board.add(grid)

  return board
}

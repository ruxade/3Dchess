// Chess pieces: loading the models once, then stamping out 32 meshes.
//
// Loading is split from placing on purpose. Loading is async, placing is
// instant and can be redone at any time, for example to reset the game.

import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { BOARD, BACK_RANK, PIECE_MODELS } from '../config.js'
import { squareToWorld, squareName } from '../chess/coords.js'

/**
 * Load every model in PIECE_MODELS and return { pawn: BufferGeometry, ... }.
 *
 * The .glb files are made by tools/decimate.py: one mesh each, y up, base at
 * y = 0, centred on x and z, already at world scale. We still bake any node
 * transform into the vertices so a piece is a single flat Mesh whose
 * `position` is where it stands and `rotation.y` is which way it faces.
 */
export async function loadPieceGeometries(loadingManager) {
  const loader = new GLTFLoader(loadingManager)
  const geometries = {}

  await Promise.all(
    Object.entries(PIECE_MODELS).map(async ([type, path]) => {
      const gltf = await loader.loadAsync(path)
      gltf.scene.updateMatrixWorld(true)

      let source = null
      gltf.scene.traverse((child) => { if (child.isMesh && !source) source = child })
      if (!source) throw new Error(`No mesh found in ${path}`)

      const geometry = source.geometry.clone()
      geometry.applyMatrix4(source.matrixWorld)
      geometry.computeBoundingBox()
      geometry.computeBoundingSphere()
      geometries[type] = geometry
    })
  )

  return geometries
}

/**
 * Fill `group` with the 32 pieces in their starting squares.
 * White (lightPieces material) stands on ranks 1 and 2, black on ranks 7 and 8.
 * Black is turned round so knights face across the board.
 */
export function createPieceSet(geometries, materials, group) {
  const place = (type, colour, col, row) => {
    const piece = new THREE.Mesh(geometries[type], materials[`${colour}Pieces`])
    const { x, y, z } = squareToWorld(col, row)
    piece.position.set(x, y, z)
    if (colour === 'dark') piece.rotation.y = Math.PI
    piece.name = `${colour}-${type}-${squareName(col, row)}`
    piece.userData = { type, colour, col, row }   // where the 3D side thinks it stands
    group.add(piece)
  }

  BACK_RANK.forEach((type, col) => {
    place(type, 'light', col, 0)
    place('pawn', 'light', col, 1)
    place('pawn', 'dark', col, BOARD.size - 2)
    place(type, 'dark', col, BOARD.size - 1)
  })

  return group
}

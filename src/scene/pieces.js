// Chess pieces: loading the models once, then stamping out 32 meshes.
//
// Loading is split from placing on purpose. Loading is async and slow (the
// FBX files total 15 MB), placing is instant and can be redone at any time,
// for example to reset the game later.

import * as THREE from 'three'
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'
import { BOARD, BACK_RANK, PIECE_MODELS, PIECE_SCALE } from '../config.js'
import { squareToWorld, squareName } from '../chess/coords.js'

/**
 * Load every model in PIECE_MODELS and return { pawn: BufferGeometry, ... }.
 *
 * Each FBX arrives as: Group (rotated -90 degrees on x) > one Mesh.
 * That rotation is how the exporter turned a Z-up model into Y-up. Rather than
 * carry a two-level object around forever, we bake the rotation and the scale
 * straight into the vertex data. Result: one flat geometry, y is up, base of
 * the piece at y = 0, centred on x and z. A piece is then just a Mesh, which
 * makes dragging, animating and (later) physics far simpler.
 */
export async function loadPieceGeometries(loadingManager) {
  const loader = new FBXLoader(loadingManager)
  const geometries = {}

  await Promise.all(
    Object.entries(PIECE_MODELS).map(async ([type, path]) => {
      const root = await loader.loadAsync(path)
      root.updateMatrixWorld(true)

      let source = null
      root.traverse((child) => { if (child.isMesh && !source) source = child })
      if (!source) throw new Error(`No mesh found in ${path}`)

      const geometry = source.geometry.clone()
      geometry.applyMatrix4(source.matrixWorld)           // bake tilt + child offset
      geometry.scale(PIECE_SCALE, PIECE_SCALE, PIECE_SCALE)
      geometry.computeBoundingBox()
      geometry.computeBoundingSphere()
      geometries[type] = geometry
    })
  )

  return geometries
}

/**
 * Fill `group` with the 32 pieces in their starting squares.
 * White (light material) stands on ranks 1 and 2, black on ranks 7 and 8.
 * Black is turned round so knights face across the board.
 */
export function createPieceSet(geometries, materials, group) {
  const place = (type, colour, col, row) => {
    const piece = new THREE.Mesh(geometries[type], materials[colour])
    const { x, y, z } = squareToWorld(col, row)
    piece.position.set(x, y, z)
    if (colour === 'dark') piece.rotation.y = Math.PI
    piece.name = `${colour}-${type}-${squareName(col, row)}`
    piece.userData = { type, colour, col, row }   // the game state lives here for now
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

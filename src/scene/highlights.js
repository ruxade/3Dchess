// Flat markers on the board: a disc for "you can move here", a ring for
// "you can capture here", a soft ring where the carried piece came from, and
// a square under the carried piece showing where it would land.

import * as THREE from 'three'
import { HIGHLIGHT } from '../config.js'
import { nameToSquare, squareToWorld } from '../chess/coords.js'

export function createHighlights(scene) {
  const group = new THREE.Group()
  group.name = 'highlights'
  scene.add(group)

  const flat = (color, opacity) =>
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false })

  const disc = new THREE.CircleGeometry(0.16, 32)
  const ring = new THREE.RingGeometry(0.32, 0.42, 48)
  const square = new THREE.PlaneGeometry(0.96, 0.96)
  const materials = {
    move: flat(HIGHLIGHT.move, 0.6),
    capture: flat(HIGHLIGHT.capture, 0.85),
    origin: flat(HIGHLIGHT.origin, 0.9),
    targetOk: flat(HIGHLIGHT.origin, 0.45),
    targetNo: flat(0x000000, 0.25)
  }

  // The landing marker is one mesh that we move around and show or hide.
  const target = new THREE.Mesh(square, materials.targetOk)
  target.rotation.x = -Math.PI / 2
  target.visible = false
  scene.add(target)

  function marker(square, geometry, material) {
    const { col, row } = nameToSquare(square)
    const { x, z } = squareToWorld(col, row)
    const mesh = new THREE.Mesh(geometry, material)
    mesh.rotation.x = -Math.PI / 2       // lie flat
    mesh.position.set(x, 0.02, z)        // a hair above the squares and the grid
    group.add(mesh)
  }

  /** Show the origin square and every legal destination. */
  function show(from, moves) {
    clear()
    marker(from, ring, materials.origin)
    for (const { to, capture } of moves) {
      marker(to, capture ? ring : disc, capture ? materials.capture : materials.move)
    }
  }

  /** Put the landing marker under a square, tinted by whether the move is legal. */
  function setTarget(squareNameOrNull, legal = true) {
    if (!squareNameOrNull) {
      target.visible = false
      return
    }
    const { col, row } = nameToSquare(squareNameOrNull)
    const { x, z } = squareToWorld(col, row)
    target.position.set(x, 0.015, z)
    target.material = legal ? materials.targetOk : materials.targetNo
    target.visible = true
  }

  function clear() {
    group.clear()   // geometries and materials are shared, nothing to dispose
    target.visible = false
  }

  return { show, setTarget, clear }
}

// Physics (cannon-es). Three.js draws, cannon-es simulates. Every piece exists
// twice: a Mesh (what you see) and a Body (what collides).
//
// Pieces standing on the board are STATIC bodies: immovable obstacles that the
// simulation never moves, but that flying pieces bounce off. When a piece is
// captured, knock() turns its body DYNAMIC, gives it a shove, and from then on
// the mesh follows the body every frame until it comes to rest.

import * as CANNON from 'cannon-es'
import * as THREE from 'three'
import { BOARD, PHYSICS } from '../config.js'

export function createPhysics() {
  const world = new CANNON.World({ gravity: new CANNON.Vec3(0, PHYSICS.gravity, 0) })
  world.broadphase = new CANNON.SAPBroadphase(world)   // faster collision search
  world.allowSleep = true                              // resting bodies stop costing CPU
  world.defaultContactMaterial.friction = PHYSICS.friction
  world.defaultContactMaterial.restitution = PHYSICS.restitution

  // Scenery. The board is a box whose top face is y = 0. The plate top, one
  // square-height lower, is modelled as an infinite floor so nothing falls forever.
  const half = (BOARD.size * BOARD.squareSize) / 2
  const board = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Box(new CANNON.Vec3(half, BOARD.squareHeight / 2, half)),
    position: new CANNON.Vec3(0, -BOARD.squareHeight / 2, 0)
  })
  const floor = new CANNON.Body({ type: CANNON.Body.STATIC, shape: new CANNON.Plane() })
  floor.quaternion.setFromEuler(-Math.PI / 2, 0, 0)   // Plane faces +z by default, turn it up
  floor.position.y = -BOARD.squareHeight
  world.addBody(board)
  world.addBody(floor)

  const entries = new Map()          // mesh -> { body, halfHeight, dynamic }
  const impactListeners = new Set()
  const up = new THREE.Vector3(0, 1, 0)
  const scratch = new THREE.Vector3()

  /** A tapered cylinder that roughly fills the piece's bounding box. */
  function shapeFor(mesh) {
    const box = mesh.geometry.boundingBox
    const radius = Math.max(box.max.x - box.min.x, box.max.z - box.min.z) / 2
    const height = box.max.y - box.min.y
    return { shape: new CANNON.Cylinder(radius * PHYSICS.topRadiusRatio, radius, height, 12), halfHeight: height / 2 }
  }

  /** Give a standing piece an immovable body. Call once per mesh. */
  function addPiece(mesh) {
    const { shape, halfHeight } = shapeFor(mesh)
    const body = new CANNON.Body({ type: CANNON.Body.STATIC, shape })
    const entry = { body, halfHeight, dynamic: false }
    entries.set(mesh, entry)
    follow(mesh)
    world.addBody(body)

    body.addEventListener('collide', (event) => {
      const speed = Math.abs(event.contact.getImpactVelocityAlongNormal())
      impactListeners.forEach((fn) => fn(mesh, speed))
    })
    // A knocked piece that dozes off while still on the board gets one more shove.
    body.addEventListener('sleep', () => {
      if (!entry.dynamic) return
      const onBoard = Math.abs(body.position.x) < half + 0.4 && Math.abs(body.position.z) < half + 0.4 && body.position.y > -0.5
      if (onBoard) {
        body.wakeUp()
        const away = scratch.set(body.position.x, 0, body.position.z).normalize()
        body.velocity.set(away.x * PHYSICS.knockSpeed, PHYSICS.knockLift * 0.5, away.z * PHYSICS.knockSpeed)
      }
    })
  }

  /** Move a STATIC body to wherever its mesh now stands (after a move animation). */
  function follow(mesh) {
    const entry = entries.get(mesh)
    if (!entry || entry.dynamic) return
    entry.body.position.set(mesh.position.x, mesh.position.y + entry.halfHeight, mesh.position.z)
    entry.body.quaternion.copy(mesh.quaternion)
  }

  /**
   * Turn a piece loose: dynamic, shoved off the board. The shove points at the
   * nearest board edge (shortest way out, fewest pieces in the way), bent a
   * little towards `travel`, the capturer's line of approach, so it reads as
   * "knocked" rather than "ejected".
   */
  function knock(mesh, travel) {
    const entry = entries.get(mesh)
    if (!entry) return
    follow(mesh)
    const { body } = entry
    const { x, z } = mesh.position
    const outward = Math.abs(x) >= Math.abs(z) ? new THREE.Vector3(Math.sign(x) || 1, 0, 0) : new THREE.Vector3(0, 0, Math.sign(z) || 1)
    const direction = outward.addScaledVector(travel, PHYSICS.travelWeight).normalize()
    body.type = CANNON.Body.DYNAMIC
    body.mass = 1
    body.updateMassProperties()
    body.linearDamping = 0.15
    body.angularDamping = 0.3
    body.velocity.set(direction.x * PHYSICS.knockSpeed, PHYSICS.knockLift, direction.z * PHYSICS.knockSpeed)
    const axis = scratch.copy(up).cross(direction).normalize()   // tumble end over end
    body.angularVelocity.set(axis.x * PHYSICS.knockSpin, (Math.random() - 0.5) * 2, axis.z * PHYSICS.knockSpin)
    body.wakeUp()
    entry.dynamic = true
  }

  /** A knocked piece is put back into play: static again, following its mesh. */
  function restore(mesh) {
    const entry = entries.get(mesh)
    if (!entry) return
    const { body } = entry
    body.type = CANNON.Body.STATIC
    body.mass = 0
    body.updateMassProperties()
    body.velocity.setZero()
    body.angularVelocity.setZero()
    entry.dynamic = false
    follow(mesh)
  }

  /** Replace the collider (after a promotion changes the geometry). */
  function reshape(mesh) {
    remove(mesh)
    addPiece(mesh)
  }

  function remove(mesh) {
    const entry = entries.get(mesh)
    if (!entry) return
    world.removeBody(entry.body)
    entries.delete(mesh)
  }

  function clear() {
    for (const mesh of [...entries.keys()]) remove(mesh)
  }

  /** Advance the simulation and copy every dynamic body onto its mesh. */
  function step(dt) {
    world.step(1 / 60, dt, 3)   // fixed 60 Hz steps, at most 3 per frame
    for (const [mesh, { body, halfHeight, dynamic }] of entries) {
      if (!dynamic) continue
      mesh.quaternion.copy(body.quaternion)
      // body.position is the centre of the cylinder, mesh.position is its base
      scratch.set(0, halfHeight, 0).applyQuaternion(mesh.quaternion)
      mesh.position.copy(body.position).sub(scratch)
    }
  }

  function onImpact(fn) {
    impactListeners.add(fn)
    return () => impactListeners.delete(fn)
  }

  return { world, entries, addPiece, follow, knock, restore, reshape, remove, clear, step, onImpact }
}

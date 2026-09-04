// Shattering captures. The taken piece is swapped for a handful of shards cut
// from its own geometry at runtime (three-pinata, a port of OpenFracture),
// each shard with its own physics body, so it bursts apart and the bits skid
// off the board. Cutting a piece takes tens to hundreds of milliseconds, so
// each piece type is cut once, in idle time after loading, and the shards are
// cloned per capture. Debris shrinks away after SHATTER.lifeSeconds.

import * as THREE from 'three'
import { fracture, FractureOptions } from 'three-pinata'
import { SHATTER } from '../config.js'

export function createShatter({ scene, physics }) {
  const group = new THREE.Group()
  group.name = 'debris'
  scene.add(group)

  const cuts = new Map()        // type -> [{ geometry, centre, size }], geometry centred on its own middle
  const insides = new Map()     // outer material uuid -> darker clone for the cut faces
  const live = []               // { mesh, piece, age }
  const dummy = new THREE.Mesh()
  let geometries = null

  function setGeometries(loaded) {
    geometries = loaded
  }

  /** Cut one piece type into shards. Slow-ish, so warmUp() does it early. */
  function prepare(type) {
    if (cuts.has(type)) return cuts.get(type)
    if (!geometries) return null
    const options = new FractureOptions()
    const height = geometries[type].boundingBox.max.y
    options.fragmentCount = Math.max(SHATTER.minFragments, Math.round(SHATTER.fragmentsPerUnit * height))
    options.fractureMode = 'Non-Convex'      // a knight is anything but convex
    dummy.geometry = geometries[type]
    const shards = []
    for (const fragment of fracture(dummy, options)) {
      const geometry = fragment.toGeometry()
      if (!geometry.index || geometry.index.count < 12) { geometry.dispose(); continue }   // slivers
      geometry.computeBoundingBox()
      const centre = geometry.boundingBox.getCenter(new THREE.Vector3())
      geometry.translate(-centre.x, -centre.y, -centre.z)   // origin at the shard's middle, where its body is
      geometry.computeBoundingBox()
      const size = geometry.boundingBox.getSize(new THREE.Vector3())
      shards.push({ geometry, centre, size })
    }
    cuts.set(type, shards)
    return shards
  }

  /** Cut every type while nothing else is going on, one type per breather. */
  function warmUp(types) {
    const queue = [...types]
    const next = () => {
      const type = queue.shift()
      if (!type) return
      prepare(type)
      setTimeout(next, 80)
    }
    setTimeout(next, 600)
  }

  function insideFor(material) {
    if (!insides.has(material.uuid)) {
      const inside = material.clone()
      inside.color.setScalar(SHATTER.insideShade)
      insides.set(material.uuid, inside)
    }
    return insides.get(material.uuid)
  }

  /**
   * Blow `piece` apart where it stands. `travel` is the capturer's direction
   * (unit vector or zero), `strength` the knock slider. Returns false if the
   * type has not been cut yet (the caller falls back to a knock).
   */
  function shatter(piece, travel, strength) {
    const shards = prepare(piece.userData.type)
    if (!shards?.length) return false
    piece.visible = false
    piece.userData.shattered = true
    physics.park(piece)                     // its standing body would get in the shards' way

    const inside = insideFor(piece.material)
    const radial = new THREE.Vector3()
    for (const shard of shards) {
      const mesh = new THREE.Mesh(shard.geometry, [piece.material, inside])
      const offset = shard.centre.clone().applyQuaternion(piece.quaternion)
      mesh.position.copy(piece.position).add(offset)
      mesh.quaternion.copy(piece.quaternion)
      group.add(mesh)

      radial.set(offset.x, 0, offset.z)
      if (radial.lengthSq() < 1e-4) radial.set(Math.random() - 0.5, 0, Math.random() - 0.5)
      radial.normalize()
      const velocity = new THREE.Vector3()
        .addScaledVector(radial, SHATTER.spread * (0.5 + Math.random() * 0.5) * strength)
        .addScaledVector(travel, SHATTER.carry * strength)
      velocity.y = SHATTER.lift * (0.6 + Math.random() * 0.8) * (0.6 + 0.4 * strength) + offset.y * 1.5
      const angular = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(SHATTER.spin * strength)
      physics.addFragment(mesh, shard.size, velocity, angular)
      live.push({ mesh, piece, age: 0 })
    }
    return true
  }

  function drop(debris) {
    physics.remove(debris.mesh)
    group.remove(debris.mesh)     // geometry and materials are shared, nothing to dispose
  }

  /** Once per frame: age the debris; old shards shrink away and go. */
  function update(dt) {
    for (let i = live.length - 1; i >= 0; i--) {
      const debris = live[i]
      debris.age += dt
      const over = debris.age - SHATTER.lifeSeconds
      if (over <= 0) continue
      const scale = Math.max(0, 1 - over / SHATTER.fadeSeconds)
      debris.mesh.scale.setScalar(scale)
      if (scale === 0) { drop(debris); live.splice(i, 1) }
    }
  }

  /** Undo: the piece is whole again and its shards vanish. */
  function restore(piece) {
    if (!piece.userData.shattered) return
    piece.userData.shattered = false
    piece.visible = true
    for (let i = live.length - 1; i >= 0; i--) {
      if (live[i].piece === piece) { drop(live[i]); live.splice(i, 1) }
    }
  }

  function clear() {
    for (const debris of live) drop(debris)
    live.length = 0
  }

  return { setGeometries, prepare, warmUp, shatter, update, restore, clear, debris: group, isReady: (type) => cuts.has(type) }
}

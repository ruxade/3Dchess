// Physics world (cannon-es). This is the extension point for the "add physics"
// goal. Right now it contains the ground only and nothing is linked to it, so
// the game looks and behaves exactly as before. Read docs/ARCHITECTURE.md,
// section "Adding physics", for the recipe.
//
// The idea: Three.js draws, cannon-es simulates. Each simulated object exists
// twice, once as a Mesh (what you see) and once as a Body (what collides).
// Every frame we step the simulation and copy Body positions onto Meshes.

import * as CANNON from 'cannon-es'

export function createPhysics() {
  const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) })
  world.broadphase = new CANNON.SAPBroadphase(world)   // faster collision search
  world.allowSleep = true                              // resting bodies stop costing CPU

  // An infinite ground plane at y = 0, matching the top of the board squares.
  // CANNON.Plane faces +z by default; rotate it to face +y.
  const ground = new CANNON.Body({ type: CANNON.Body.STATIC, shape: new CANNON.Plane() })
  ground.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
  world.addBody(ground)

  const pairs = []   // { mesh, body }

  /** Register a mesh to follow a body. Adds the body to the world. */
  function link(mesh, body) {
    world.addBody(body)
    pairs.push({ mesh, body })
  }

  /** Advance the simulation by dt seconds (fixed 60 Hz steps, up to 3 per frame). */
  function step(dt) {
    world.step(1 / 60, dt, 3)
    for (const { mesh, body } of pairs) {
      mesh.position.copy(body.position)
      mesh.quaternion.copy(body.quaternion)
    }
  }

  return { world, ground, link, step, pairs }
}

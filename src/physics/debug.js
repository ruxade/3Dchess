// Wireframes that show where the physics bodies really are. Toggle from the
// Settings panel ("show colliders"). Great for seeing why a piece bounced.

import * as CANNON from 'cannon-es'
import * as THREE from 'three'

export function createPhysicsDebug(physics, scene) {
  const group = new THREE.Group()
  group.name = 'physics-debug'
  group.visible = false
  scene.add(group)

  const material = new THREE.MeshBasicMaterial({ color: 0x7fffd4, wireframe: true, transparent: true, opacity: 0.6 })
  const meshes = new Map()   // body -> wireframe mesh

  function geometryFor(shape) {
    if (shape instanceof CANNON.Cylinder) return new THREE.CylinderGeometry(shape.radiusTop, shape.radiusBottom, shape.height, 12)
    if (shape instanceof CANNON.Box) return new THREE.BoxGeometry(shape.halfExtents.x * 2, shape.halfExtents.y * 2, shape.halfExtents.z * 2)
    if (shape instanceof CANNON.Plane) return new THREE.PlaneGeometry(40, 40, 8, 8)
    return new THREE.SphereGeometry(0.2, 8, 8)
  }

  /** Call once per frame while visible. */
  function sync() {
    if (!group.visible) return
    const seen = new Set()
    for (const body of physics.world.bodies) {
      seen.add(body)
      let mesh = meshes.get(body)
      if (!mesh) {
        mesh = new THREE.Mesh(geometryFor(body.shapes[0]), material)
        meshes.set(body, mesh)
        group.add(mesh)
      }
      mesh.position.copy(body.position)
      mesh.quaternion.copy(body.quaternion)
    }
    for (const [body, mesh] of meshes) {
      if (!seen.has(body)) {
        group.remove(mesh)
        mesh.geometry.dispose()
        meshes.delete(body)
      }
    }
  }

  return { group, sync, setVisible: (v) => { group.visible = v } }
}

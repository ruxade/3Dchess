// The gallery (key G): one piece at a time on a small pedestal, inside a small
// sky sphere, with its own camera and orbit controls. Auto-rotates until you
// grab it. Shares geometries and materials with the game, nothing loads twice.

import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GALLERY } from '../config.js'
import { createSkySphere } from './environment.js'

export function createGallery(materials, canvas, sizes) {
  const scene = new THREE.Scene()
  scene.name = 'gallery'
  scene.add(createSkySphere(GALLERY.sphereRadius, materials.sky))

  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.25, 0.18, 64), materials.plate)
  pedestal.position.y = -0.09
  scene.add(pedestal)

  const piece = new THREE.Mesh(new THREE.BufferGeometry(), materials.display)
  piece.name = 'gallery-piece'
  scene.add(piece)

  const camera = new THREE.PerspectiveCamera(GALLERY.fov, sizes.width / sizes.height, 0.1, 100)
  const controls = new OrbitControls(camera, canvas)
  controls.enabled = false                 // views.js turns it on in gallery mode
  controls.enableDamping = true
  controls.enablePan = false
  controls.autoRotate = true
  controls.autoRotateSpeed = GALLERY.autoRotateSpeed
  controls.minDistance = 2
  controls.maxDistance = 9
  controls.maxPolarAngle = Math.PI * 0.6   // a little below the pedestal, no further

  let geometries = null
  let current = GALLERY.first

  /** Called once the geometries have loaded. */
  function populate(loaded) {
    geometries = loaded
    show(current)
  }

  /** Put one piece type on the pedestal. Returns facts for the caption. */
  function show(type) {
    current = type
    if (!geometries) return null
    const geometry = geometries[type]
    piece.geometry = geometry
    const height = geometry.boundingBox.max.y
    controls.target.set(0, height * 0.5, 0)
    camera.position.set(0, height * 0.75, height * 2.2 + 1.2)
    controls.update()
    const triangles = geometry.index ? geometry.index.count / 3 : geometry.attributes.position.count / 3
    return { type, height, triangles }
  }

  function step(direction) {
    const i = GALLERY.order.indexOf(current)
    return show(GALLERY.order[(i + direction + GALLERY.order.length) % GALLERY.order.length])
  }

  const view = { scene, camera, postFx: false, update: () => controls.update() }

  return {
    view,
    populate,
    show,
    step,
    current: () => current,
    setActive: (active) => { controls.enabled = active },
    update: () => controls.update(),
    setAspect: (aspect) => { camera.aspect = aspect; camera.updateProjectionMatrix() }
  }
}

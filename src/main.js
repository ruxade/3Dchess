// Entry point. Read this file top to bottom and you have the whole app:
// build the scene, wire the controls, load the pieces, start the frame loop.
// Each import owns one job. See docs/ARCHITECTURE.md for the map.

import './style.css'
import * as THREE from 'three'
import { sizes, onResize } from './core/sizes.js'
import { createLoading } from './core/loading.js'
import { createRenderer, enableFullscreenOnDoubleClick } from './core/renderer.js'
import { createMaterials } from './scene/materials.js'
import { createEnvironment } from './scene/environment.js'
import { createBoard } from './scene/board.js'
import { loadPieceGeometries, createPieceSet } from './scene/pieces.js'
import { createShowcase } from './scene/showcase.js'
import { createMainCamera } from './controls/cameras.js'
import { createDragControls } from './controls/drag.js'
import { createViews } from './controls/views.js'
import { createPhysics } from './physics/world.js'
import { createGui } from './debug/gui.js'

// ---- 1. Scene -------------------------------------------------------------
const canvas = document.querySelector('canvas.webgl')
const scene = new THREE.Scene()

const loading = createLoading(scene)                        // progress bar + fade overlay
const textureLoader = new THREE.TextureLoader(loading.manager)
const materials = createMaterials(textureLoader)

createEnvironment(scene, materials)                         // sky sphere + fog
scene.add(createBoard(materials))                           // plate + 64 squares + grid

const pieces = new THREE.Group()                            // filled once models load
pieces.name = 'pieces'
scene.add(pieces)

const showcase = createShowcase(materials, sizes)           // scene for views 2 to 5

// ---- 2. Camera, rendering, controls ---------------------------------------
const mainCamera = createMainCamera(canvas, sizes)
const { render, passes } = createRenderer(canvas, scene, mainCamera.camera)
enableFullscreenOnDoubleClick(canvas)

const settings = { dragging: true }                         // user toggles live here
const dragControls = createDragControls(pieces, mainCamera.camera, canvas, mainCamera.controls)
const physics = createPhysics()                             // empty world, ready to use

const gui = createGui({ scene, camera: mainCamera.camera, passes, pieces, dragControls, settings })
const views = createViews({
  main: { scene, camera: mainCamera.camera },
  showcase,
  orbitControls: mainCamera.controls,
  dragControls,
  gui,
  settings
})

onResize(({ width, height }) => {
  mainCamera.setAspect(width / height)
  showcase.setAspect(width / height)
})

// ---- 3. Load the pieces (async) -------------------------------------------
loadPieceGeometries(loading.manager)
  .then((geometries) => {
    createPieceSet(geometries, materials, pieces)
    showcase.populate(geometries)
  })
  .catch((error) => console.error('Could not load the chess set:', error))

// ---- 4. Frame loop --------------------------------------------------------
const clock = new THREE.Clock()

function tick() {
  const dt = clock.getDelta()      // seconds since last frame
  mainCamera.update()              // orbit damping + keep inside the world
  physics.step(dt)                 // no bodies yet, so this is a no-op for now
  render(views.current)            // main view through post FX, showcase direct
  window.requestAnimationFrame(tick)
}

tick()

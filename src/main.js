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
import { createHighlights } from './scene/highlights.js'
import { createRules } from './chess/rules.js'
import { createGameController } from './chess/controller.js'
import { createStatus } from './ui/status.js'
import { createPalette, loadSavedPalette } from './ui/palette.js'
import { createHelp } from './ui/help.js'
import { createGui } from './debug/gui.js'

// ---- 1. Scene -------------------------------------------------------------
const canvas = document.querySelector('canvas.webgl')
const scene = new THREE.Scene()

const loading = createLoading(scene)                        // progress bar + fade overlay
const textureLoader = new THREE.TextureLoader(loading.manager)
const materials = createMaterials(textureLoader, loadSavedPalette())   // remembers your colours

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
const dragControls = createDragControls(mainCamera.camera, canvas, mainCamera.controls)
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

// ---- 3. Load the pieces, then start the game (async) ----------------------
const rules = createRules()                                 // chess.js behind a small API
const highlights = createHighlights(scene)                  // legal-move markers
const status = createStatus()                               // "White to move" line
createPalette(materials)                                    // colour panel, key P
createHelp()                                                // help panel, key ?

loadPieceGeometries(loading.manager)
  .then((geometries) => {
    createPieceSet(geometries, materials, pieces)
    showcase.populate(geometries)
    const game = createGameController({ rules, pieces, geometries, materials, highlights, status, dragControls })
    dragControls.setHandlers(game)                          // drag asks the game what is allowed
    // Poke at the game from the browser console: chess.rules.fen(), chess.pieces.children, ...
    window.chess = { rules, pieces, camera: mainCamera.camera, game, dragControls }
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

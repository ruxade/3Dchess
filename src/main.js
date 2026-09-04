// Entry point. Read this file top to bottom and you have the whole app:
// build the scene, wire the controls, load the pieces, start the frame loop.
// Each import owns one job. See docs/ARCHITECTURE.md for the map.

import './style.css'
import * as THREE from 'three'
import { sizes, onResize } from './core/sizes.js'
import { createLoading } from './core/loading.js'
import { createRenderer, enableFullscreenOnDoubleClick } from './core/renderer.js'
import { createSound } from './core/sound.js'
import { createMaterials } from './scene/materials.js'
import { createEnvironment } from './scene/environment.js'
import { createBoard } from './scene/board.js'
import { loadPieceGeometries, createPieceSet } from './scene/pieces.js'
import { createHighlights } from './scene/highlights.js'
import { createEffects } from './scene/effects.js'
import { createGallery } from './scene/gallery.js'
import { createMainCamera } from './controls/cameras.js'
import { createDragControls } from './controls/drag.js'
import { createViews } from './controls/views.js'
import { createPhysics } from './physics/world.js'
import { createPhysicsDebug } from './physics/debug.js'
import { createRules } from './chess/rules.js'
import { createGameController } from './chess/controller.js'
import { createOpponent } from './chess/opponent.js'
import { createGui } from './debug/gui.js'
import { createStatus } from './ui/status.js'
import { createPalette, loadSavedPalette } from './ui/palette.js'
import { createHelp } from './ui/help.js'
import { createGalleryUi } from './ui/gallery.js'
import { createMovesUi } from './ui/moves.js'
import { createPromotionUi } from './ui/promotion.js'

// Things the user can toggle at runtime (Settings panel). Modules read these live.
const settings = { dragging: true, physics: true, sound: true, followTurn: true, showColliders: false, opponent: 'off', humanColour: 'light' }
const hooks = {}   // the settings panel calls these; the game controller fills them in once it exists

// ---- 1. Scene -------------------------------------------------------------
const canvas = document.querySelector('canvas.webgl')
const scene = new THREE.Scene()

const loading = createLoading(scene)                        // progress bar + fade overlay
const textureLoader = new THREE.TextureLoader(loading.manager)
const materials = createMaterials(textureLoader, loadSavedPalette())   // remembers your colours

createEnvironment(scene, materials)                         // sky sphere + fog
materials.onSky((colour) => scene.fog.color.copy(colour))   // fog always matches the sky
scene.add(createBoard(materials))                           // plate + 64 squares + grid

const pieces = new THREE.Group()                            // filled once models load
pieces.name = 'pieces'
scene.add(pieces)

const highlights = createHighlights(scene)                  // legal-move markers
const effects = createEffects(scene)                        // particle puffs
const gallery = createGallery(materials, canvas, sizes)     // key G: one piece on a turntable

// ---- 2. Camera, rendering, controls ---------------------------------------
const mainCamera = createMainCamera(canvas, sizes)
mainCamera.view.scene = scene
const { render, passes } = createRenderer(canvas, scene, mainCamera.camera)
enableFullscreenOnDoubleClick(canvas)

const dragControls = createDragControls(mainCamera.camera, canvas, mainCamera.controls)
const physics = createPhysics()                             // bodies for pieces, board, floor
const physicsDebug = createPhysicsDebug(physics, scene)     // wireframes, off by default
const sound = createSound(settings)

const gui = createGui({ scene, camera: mainCamera.camera, passes, pieces, dragControls, settings, physicsDebug, hooks })
const views = createViews({ game: mainCamera, gallery, dragControls, gui, settings, onChange: (mode) => { if (mode === 'gallery') galleryUi.render() } })
const galleryUi = createGalleryUi({ gallery, views })
const status = createStatus()                               // "White to move" line
createPalette(materials)                                    // colour panel, key P
createHelp()                                                // help panel, key ?
const promotionUi = createPromotionUi()                     // queen, rook, bishop or knight
const movesUi = createMovesUi({ onUndo: () => hooks.undo?.(), onNew: () => hooks.reset?.() })
const opponent = createOpponent()                           // the engine, in a worker

onResize(({ width, height }) => {
  mainCamera.setAspect(width / height)
  gallery.setAspect(width / height)
})

// ---- 3. Load the pieces, then start the game (async) ----------------------
const rules = createRules()                                 // chess.js behind a small API

loadPieceGeometries(loading.manager)
  .then((geometries) => {
    createPieceSet(geometries, materials, pieces)
    gallery.populate(geometries)
    const game = createGameController({
      rules, pieces, geometries, materials, highlights, status, dragControls, physics, sound, effects,
      camera: mainCamera, settings, opponent, movesUi, promotionUi
    })
    dragControls.setHandlers(game)                          // drag asks the game what is allowed
    hooks.undo = game.undo
    hooks.reset = game.reset
    hooks.onOpponentChange = game.onOpponentChange
    hooks.onColourChange = game.reset
    // Poke at the game from the browser console: chess.rules.fen(), chess.game.reset(), ...
    window.chess = { rules, pieces, camera: mainCamera.camera, game, dragControls, physics, physicsDebug, materials, settings, views, gui }
  })
  .catch((error) => console.error('Could not load the chess set:', error))

// ---- 4. Frame loop --------------------------------------------------------
const clock = new THREE.Clock()

function tick() {
  const dt = clock.getDelta()      // seconds since last frame
  if (views.state.mode === 'gallery') gallery.update()
  else mainCamera.update()         // orbit damping + keep inside the world
  physics.step(dt)                 // simulate, then copy bodies onto flying pieces
  effects.update(dt)               // particles
  physicsDebug.sync()              // only does work while colliders are shown
  render(views.state.current)      // game view through post FX, gallery direct
  window.requestAnimationFrame(tick)
}

tick()

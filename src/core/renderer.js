// The WebGL renderer and the post-processing chain.
//
// Without post-processing a frame is: renderer.render(scene, camera).
// With it, EffectComposer renders the scene into an offscreen texture, then
// each Pass reads that texture, applies an effect, and writes a new one.
// The last pass writes to the screen.

import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { DotScreenPass } from 'three/addons/postprocessing/DotScreenPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { POST_FX } from '../config.js'
import { sizes, onResize } from './sizes.js'

export function createRenderer(canvas, scene, camera) {
  const renderer = new THREE.WebGLRenderer({ canvas })
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(sizes.pixelRatio)

  const composer = new EffectComposer(renderer)
  composer.setSize(sizes.width, sizes.height)
  composer.setPixelRatio(sizes.pixelRatio)

  // Pass 1: draw the main scene. The composer is tied to THIS scene and camera,
  // which is why the showcase views bypass it and use renderer.render directly.
  composer.addPass(new RenderPass(scene, camera))

  const dotScreen = new DotScreenPass()
  dotScreen.enabled = POST_FX.dotScreenEnabled
  composer.addPass(dotScreen)

  const bloom = new UnrealBloomPass()
  bloom.enabled = POST_FX.bloomEnabled
  bloom.strength = POST_FX.bloomStrength
  composer.addPass(bloom)

  onResize(({ width, height, pixelRatio }) => {
    renderer.setSize(width, height)
    renderer.setPixelRatio(pixelRatio)
    composer.setSize(width, height)
    composer.setPixelRatio(pixelRatio)
  })

  /** Draw one frame of the given view ({ scene, camera, postFx }). */
  function render(view) {
    if (view.postFx) composer.render()
    else renderer.render(view.scene, view.camera)
  }

  return { renderer, composer, passes: { dotScreen, bloom }, render }
}

/** Double-click anywhere toggles fullscreen. */
export function enableFullscreenOnDoubleClick(canvas) {
  window.addEventListener('dblclick', () => {
    if (!document.fullscreenElement) canvas.requestFullscreen()
    else document.exitFullscreen()
  })
}

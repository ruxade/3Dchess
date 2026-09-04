// The settings panel (lil-gui, the maintained successor of dat.gui).
// Each control edits a live object, so changes show instantly.

import GUI from 'lil-gui'
import { FOG } from '../config.js'

export function createGui({ scene, camera, passes, pieces, dragControls, settings }) {
  const gui = new GUI({ title: 'Settings', width: 220 })
  gui.close()

  const fog = gui.addFolder('Fog')
  const fogState = { color: FOG.color, density: FOG.density }
  fog.add(fogState, 'density', 0, 0.15, 0.005).onChange((v) => { scene.fog.density = v })
  fog.addColor(fogState, 'color').onChange((v) => { scene.fog.color.set(v) })

  const cam = gui.addFolder('Camera')
  cam.add(camera, 'fov', 10, 75, 1).name('field of view').onChange(() => camera.updateProjectionMatrix())

  const fx = gui.addFolder('Post FX')
  fx.add(passes.bloom, 'enabled').name('bloom')
  fx.add(passes.bloom, 'strength', 0, 0.5, 0.01).name('bloom strength')
  fx.add(passes.dotScreen, 'enabled').name('dot screen')

  const game = gui.addFolder('Pieces')
  game.add(pieces, 'visible').name('show pieces')
  game.add(settings, 'dragging').name('allow dragging').onChange((v) => { dragControls.enabled = v })

  return gui
}

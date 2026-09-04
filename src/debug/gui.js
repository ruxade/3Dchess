// The settings panel (lil-gui, the maintained successor of dat.gui).
// Each control edits a live object, so changes show instantly. Key H hides it.

import GUI from 'lil-gui'
import { FOG, OPPONENT } from '../config.js'

export function createGui({ scene, camera, passes, pieces, dragControls, settings, physicsDebug, hooks }) {
  const gui = new GUI({ title: 'Settings', width: 230 })
  gui.close()

  const game = gui.addFolder('Game')
  game.add(settings, 'opponent', OPPONENT.levels).name('computer plays').onChange(() => hooks.onOpponentChange?.())
  game.add(settings, 'humanColour', { white: 'light', black: 'dark' }).name('you play').onChange(() => hooks.onColourChange?.())
  game.add(settings, 'followTurn').name('camera follows turn')
  game.add(settings, 'physics').name('knock captured pieces')
  game.add(settings, 'sound').name('sound')
  game.add(settings, 'dragging').name('allow dragging').onChange((v) => { dragControls.enabled = v })
  game.add(pieces, 'visible').name('show pieces')

  const look = gui.addFolder('Look')
  const fogState = { density: FOG.density }
  look.add(fogState, 'density', 0, 0.15, 0.005).name('fog density').onChange((v) => { scene.fog.density = v })
  look.add(camera, 'fov', 10, 75, 1).name('field of view').onChange(() => camera.updateProjectionMatrix())
  look.add(passes.bloom, 'enabled').name('bloom')
  look.add(passes.bloom, 'strength', 0, 0.5, 0.01).name('bloom strength')
  look.add(passes.dotScreen, 'enabled').name('dot screen')

  const debug = gui.addFolder('Debug')
  debug.add(settings, 'showColliders').name('show colliders').onChange((v) => physicsDebug.setVisible(v))
  debug.close()

  return gui
}

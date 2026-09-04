// Which scene and camera are on screen right now, and how the user switches.
//
// Keys 1 to 5 (or clicking the badges in the instructions panel) pick a view.
// View 1 is the interactive board with post-processing and orbit controls.
// Views 2 to 5 are the showcase cameras: no controls, no post-processing.
// Key H hides and shows the settings panel.

export function createViews({ main, showcase, orbitControls, dragControls, gui, settings }) {
  const views = {
    '1': { scene: main.scene, camera: main.camera, postFx: true, interactive: true }
  }
  for (const [key, camera] of Object.entries(showcase.cameras)) {
    views[key] = { scene: showcase.scene, camera, postFx: false, interactive: false }
  }

  const state = { current: views['1'] }

  function select(key) {
    const view = views[key]
    if (!view) return
    state.current = view
    orbitControls.enabled = view.interactive
    dragControls.enabled = view.interactive && settings.dragging
    if (view.interactive) gui.show()
    else gui.hide()
    document.querySelectorAll('[data-camera]').forEach((el) => {
      el.classList.toggle('active', el.dataset.camera === key)
    })
  }

  window.addEventListener('keydown', (event) => {
    if (event.key === 'h' || event.key === 'H') gui.show(gui._hidden)
    else select(event.key)
  })

  document.querySelectorAll('[data-camera]').forEach((el) => {
    el.addEventListener('click', () => select(el.dataset.camera))
  })

  select('1')
  return state
}

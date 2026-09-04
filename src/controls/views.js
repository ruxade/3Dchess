// Two modes: the game (board, drag, post-processing, settings) and the gallery
// (one piece on a turntable). Exactly one set of controls is live at a time.
// body[data-mode] lets the CSS show the right panels.

export function createViews({ game, gallery, dragControls, gui, settings, onChange }) {
  const state = { mode: 'game', current: game.view }

  function select(mode) {
    if (mode !== 'game' && mode !== 'gallery') return
    state.mode = mode
    state.current = mode === 'game' ? game.view : gallery.view
    game.controls.enabled = mode === 'game'
    gallery.setActive(mode === 'gallery')
    dragControls.enabled = mode === 'game' && settings.dragging
    if (mode === 'game') gui.show()
    else gui.hide()
    document.body.dataset.mode = mode
    onChange?.(mode)
  }

  window.addEventListener('keydown', (event) => {
    if ((event.key === 'h' || event.key === 'H') && state.mode === 'game') gui.show(gui._hidden)
  })

  select('game')
  return { state, select }
}

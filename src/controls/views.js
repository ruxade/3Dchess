// Three modes: the game (board, drag, post-processing, settings), the gallery
// (one piece on a turntable) and the victory screen (the winner's pawn).
// Exactly one set of controls is live at a time. body[data-mode] lets the CSS
// show the right panels. Every view carries its own update(dt) for the frame loop.

export function createViews({ game, gallery, victory, dragControls, gui, settings, onChange }) {
  const views = { game: game.view, gallery: gallery.view, victory: victory.view }
  const state = { mode: 'game', current: game.view }

  function select(mode) {
    if (!views[mode]) return
    state.mode = mode
    state.current = views[mode]
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

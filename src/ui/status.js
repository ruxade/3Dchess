// The one-line status message under the board ("White to move", "Check", ...).

export function createStatus() {
  const element = document.querySelector('.status')

  function show(text, tone = 'normal') {
    element.textContent = text
    element.dataset.tone = tone
  }

  /** Turn a rules.status() object into words. */
  function fromRules(state) {
    const side = state.turn === 'light' ? 'White' : 'Black'
    const other = state.turn === 'light' ? 'Black' : 'White'
    if (state.checkmate) return show(`Checkmate. ${other} wins. Press N for a new game.`, 'end')
    if (state.stalemate) return show('Stalemate. Press N for a new game.', 'end')
    if (state.draw) return show('Draw. Press N for a new game.', 'end')
    if (state.check) return show(`${side} to move. Check!`, 'alert')
    show(`${side} to move`)
  }

  return { show, fromRules }
}

// The victory screen's words and buttons: who won and how, New game, back to
// the board. Escape returns to the board, N starts over (the controller hears N too).

export function createVictoryUi({ victory, views, onNew }) {
  const bar = document.querySelector('.victory-bar')
  bar.innerHTML = `
    <h2 class="victory-name"></h2>
    <p class="victory-line"></p>
    <div class="victory-nav">
      <button class="new chip active">New game</button>
      <button class="back">Back to the board</button>
    </div>`
  const name = bar.querySelector('.victory-name')
  const line = bar.querySelector('.victory-line')

  /** { winner: 'light' | 'dark', reason: 'checkmate' | 'time' } */
  function celebrate({ winner, reason }) {
    name.textContent = `${winner === 'light' ? 'White' : 'Black'} wins`
    line.textContent = reason === 'time' ? `${winner === 'light' ? 'Black' : 'White'} ran out of time.` : 'Checkmate.'
    victory.show(winner)
    views.select('victory')
  }

  bar.querySelector('.new').addEventListener('click', () => { views.select('game'); onNew() })
  bar.querySelector('.back').addEventListener('click', () => views.select('game'))
  window.addEventListener('keydown', (event) => {
    if (views.state.mode !== 'victory') return
    if (event.key === 'Escape' || event.key === 'n' || event.key === 'N') views.select('game')
  })

  return { celebrate }
}

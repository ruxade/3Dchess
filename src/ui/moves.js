// The move list: numbered pairs in algebraic notation, plus Undo and New game.
// Key U undoes. The header click folds the list away.

export function createMovesUi({ onUndo, onNew }) {
  const panel = document.querySelector('.moves')
  panel.innerHTML = `
    <header><span>Moves</span><span class="moves-actions"><button class="undo" title="Undo (U)">Undo</button><button class="new" title="New game (N)">New</button></span></header>
    <ol class="moves-list"></ol>`
  const list = panel.querySelector('.moves-list')

  panel.querySelector('.undo').addEventListener('click', () => onUndo())
  panel.querySelector('.new').addEventListener('click', () => onNew())
  panel.querySelector('header span:first-child').addEventListener('click', () => panel.classList.toggle('folded'))
  window.addEventListener('keydown', (event) => {
    if (event.key === 'u' || event.key === 'U') onUndo()
  })

  /** history: ['e4', 'e5', 'Nf3', ...] */
  function render(history) {
    const rows = []
    for (let i = 0; i < history.length; i += 2) {
      rows.push(`<li><span class="n">${i / 2 + 1}.</span><span>${history[i]}</span><span>${history[i + 1] ?? ''}</span></li>`)
    }
    list.innerHTML = rows.join('') || '<li class="empty">No moves yet</li>'
    list.scrollTop = list.scrollHeight
    panel.querySelector('.undo').disabled = history.length === 0
  }

  if (window.matchMedia('(max-width: 720px)').matches) panel.classList.add('folded')   // small screens: just the header

  render([])
  return { render }
}

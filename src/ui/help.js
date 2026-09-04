// The help panel (controls list). Opens on hover or click of the ? button,
// and with the ? key. Tiny on purpose: the content is plain HTML in index.html.

export function createHelp() {
  const panel = document.querySelector('.help')
  const button = document.querySelector('.fab-help')

  const toggle = (force) => {
    const open = force ?? panel.hidden
    panel.hidden = !open
    button.classList.toggle('active', open)
  }

  button.addEventListener('click', () => toggle())
  window.addEventListener('keydown', (event) => {
    if (event.key === '?') toggle()
    if (event.key === 'Escape') toggle(false)
  })

  // Any click on the canvas closes it, so it never sits over the board for long.
  document.querySelector('canvas.webgl').addEventListener('pointerdown', () => toggle(false))

  return { toggle }
}

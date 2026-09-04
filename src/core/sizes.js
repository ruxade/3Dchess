// One place that knows how big the viewport is. Anything that cares about
// size (camera aspect, renderer, post-processing) subscribes with onResize.

export const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: Math.min(window.devicePixelRatio, 2)   // cap at 2: retina is enough
}

const listeners = new Set()

/** Call fn(sizes) whenever the window is resized. Returns an unsubscribe function. */
export function onResize(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

window.addEventListener('resize', () => {
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight
  sizes.pixelRatio = Math.min(window.devicePixelRatio, 2)
  listeners.forEach((fn) => fn(sizes))
})

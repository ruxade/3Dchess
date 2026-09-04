// A chess clock. Pure: no DOM, no timers of its own. main.js feeds it the
// frame delta through tick(dt) and the clocks panel reads remaining().
//
// Rules of the road: nothing runs until the first move. Each move stops the
// mover's clock, adds the increment to it, and starts the other side. When a
// clock reaches zero that side has "flagged": the game is over on time and
// the clock never runs again until reset().

export function createClock({ minutes, increment }, onFlag = () => {}) {
  const initial = minutes * 60000
  const bonus = increment * 1000
  const left = { light: initial, dark: initial }
  let active = null     // 'light' | 'dark' | null: whose clock is counting down
  let flag = null       // who ran out of time

  /** `colour` has just completed a move. */
  function press(colour) {
    if (flag) return
    if (active === colour) left[colour] += bonus
    active = colour === 'light' ? 'dark' : 'light'
  }

  /** After an undo: whoever is to move now should be on the clock (if it was running). */
  function switchTo(colour) {
    if (flag || active === null) return
    active = colour
  }

  /** Put a side on the clock now (the clock was switched on mid-game). */
  function start(colour) {
    if (flag) return
    active = colour
  }

  /** dt in seconds, from the frame loop. */
  function tick(dt) {
    if (!active) return
    left[active] -= dt * 1000
    if (left[active] > 0) return
    left[active] = 0
    flag = active
    active = null
    onFlag(flag)
  }

  /** Stop counting without flagging (checkmate, stalemate, draw). */
  function stop() {
    active = null
  }

  function reset() {
    left.light = initial
    left.dark = initial
    active = null
    flag = null
  }

  /** Restore saved times. The clock waits for the next move before running; a side saved at zero stays flagged. */
  function setRemaining({ light, dark }) {
    left.light = Math.max(0, light)
    left.dark = Math.max(0, dark)
    active = null
    flag = left.light <= 0 ? 'light' : left.dark <= 0 ? 'dark' : null
  }

  return {
    press, switchTo, start, tick, stop, reset, setRemaining,
    remaining: (colour) => left[colour],
    running: () => active,
    flagged: () => flag
  }
}

/** 300000 -> '5:00'. Under twenty seconds the tenths show: '0:19.9'. */
export function formatClock(ms) {
  const clamped = Math.max(0, ms)
  const totalSeconds = clamped / 1000
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds - m * 60
  if (clamped < 20000) return `${m}:${s < 10 ? '0' : ''}${s.toFixed(1)}`
  const whole = Math.floor(s)
  return `${m}:${whole < 10 ? '0' : ''}${whole}`
}

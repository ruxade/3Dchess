// Sounds: a tiny click sample for knocks and landings, played at a volume that
// matches the impact, and a rock-break recording for a shatter (five to choose
// from under Settings, Game, "shatter sound"). Browsers only allow audio after
// the first click, which a chess move is.

import { SHATTER } from '../config.js'

export function createSound(settings) {
  const click = new Audio('/sounds/hit.mp3')
  click.preload = 'auto'
  const breaks = {}     // name -> Audio, loaded on first use
  let lastPlayed = 0

  function play(sample, volume, rate = 1) {
    const voice = sample.cloneNode()
    voice.volume = Math.min(1, Math.max(0.05, volume))
    voice.playbackRate = rate
    voice.play().catch(() => { /* not allowed yet, ignore */ })
  }

  /** strength 0..1 */
  function hit(strength) {
    if (!settings.sound) return
    const now = performance.now()
    if (now - lastPlayed < 50) return   // never machine-gun overlapping hits
    lastPlayed = now
    play(click, strength)
  }

  /** A piece breaking apart. strength 0..1 sets the volume; the pitch wobbles a little so no two breaks sound the same. */
  function crack(strength = 0.6) {
    if (!settings.sound) return
    const name = SHATTER.sounds[settings.shatterSound] ? settings.shatterSound : SHATTER.defaultSound
    breaks[name] ??= Object.assign(new Audio(SHATTER.sounds[name]), { preload: 'auto' })
    play(breaks[name], 0.5 + strength * 0.5, 0.94 + Math.random() * 0.12)
  }

  return { hit, crack }
}

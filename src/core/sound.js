// Sounds. Two kinds: a tiny click sample for knocks and landings, played at a
// volume that matches the impact, and a synthesised rock crack for a shatter
// (Web Audio, no sample file: a low thump, a gritty crunch, then a scatter of
// pebble ticks). Browsers only allow audio after the first click, which a
// chess move is.

export function createSound(settings) {
  const sample = new Audio('/sounds/hit.mp3')
  sample.preload = 'auto'
  let lastPlayed = 0
  let ctx = null
  let noiseBuffer = null

  /** strength 0..1 */
  function hit(strength) {
    if (!settings.sound) return
    const now = performance.now()
    if (now - lastPlayed < 50) return   // never machine-gun overlapping hits
    lastPlayed = now
    const voice = sample.cloneNode()
    voice.volume = Math.min(1, Math.max(0.05, strength))
    voice.play().catch(() => { /* not allowed yet, ignore */ })
  }

  function audio() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)() } catch { return null }
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})
    return ctx
  }

  /** Half a second of white noise, made once. */
  function noise(c) {
    if (!noiseBuffer) {
      const n = Math.floor(c.sampleRate * 0.5)
      noiseBuffer = c.createBuffer(1, n, c.sampleRate)
      const data = noiseBuffer.getChannelData(0)
      for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1
    }
    return noiseBuffer
  }

  /** A piece cracking apart. strength 0..1 sets loudness and how many pebbles follow. */
  function crack(strength = 0.6) {
    if (!settings.sound) return
    const c = audio()
    if (!c) return
    const t = c.currentTime
    const master = c.createGain()
    master.gain.value = Math.min(1, 0.35 + strength * 0.5)
    master.connect(c.destination)

    // Thump: a falling tone, the body of the break.
    const thump = c.createOscillator()
    thump.type = 'triangle'
    thump.frequency.setValueAtTime(160, t)
    thump.frequency.exponentialRampToValueAtTime(40, t + 0.2)
    const thumpGain = c.createGain()
    thumpGain.gain.setValueAtTime(0.9, t)
    thumpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25)
    thump.connect(thumpGain).connect(master)
    thump.start(t)
    thump.stop(t + 0.26)

    // Crunch: noise through a band-pass that slides down, dying fast.
    const crunch = c.createBufferSource()
    crunch.buffer = noise(c)
    const band = c.createBiquadFilter()
    band.type = 'bandpass'
    band.frequency.setValueAtTime(900, t)
    band.frequency.exponentialRampToValueAtTime(300, t + 0.3)
    band.Q.value = 0.8
    const crunchGain = c.createGain()
    crunchGain.gain.setValueAtTime(1, t)
    crunchGain.gain.exponentialRampToValueAtTime(0.001, t + 0.32)
    crunch.connect(band).connect(crunchGain).connect(master)
    crunch.start(t)
    crunch.stop(t + 0.35)

    // Pebbles: short bright ticks scattered over the next half second.
    const ticks = 5 + Math.round(strength * 5)
    for (let i = 0; i < ticks; i++) {
      const at = t + 0.04 + Math.random() * 0.45
      const tick = c.createBufferSource()
      tick.buffer = noise(c)
      const high = c.createBiquadFilter()
      high.type = 'highpass'
      high.frequency.value = 2500 + Math.random() * 3000
      const tickGain = c.createGain()
      tickGain.gain.setValueAtTime(0.25 + Math.random() * 0.35, at)
      tickGain.gain.exponentialRampToValueAtTime(0.001, at + 0.03 + Math.random() * 0.04)
      tick.connect(high).connect(tickGain).connect(master)
      tick.start(at)
      tick.stop(at + 0.08)
    }
  }

  return { hit, crack }
}

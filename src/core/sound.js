// One tiny click sample, played at a volume that matches the impact.
// Browsers only allow audio after the first click, which a chess move is.

export function createSound(settings) {
  const sample = new Audio('/sounds/hit.mp3')
  sample.preload = 'auto'
  let lastPlayed = 0

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

  return { hit }
}

// localStorage with the sharp edges filed off: JSON in and out, and a
// private-mode browser (where storage throws) just means nothing is remembered.

export function loadJson(key) {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage full or blocked: play on without saving
  }
}

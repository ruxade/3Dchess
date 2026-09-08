// The self-playing demo. A drawn cursor glides to a piece, presses, carries it
// to its square and lets go, using the same onPickUp / onCarry / onDrop path a
// real drag uses, so highlights, captures, sounds, the clock and the move list
// all behave exactly as they would for a person. It lives at /demo (demo.html
// declares window.CHESS_DEMO and loops); on the main page key D starts it and
// ?demo=<game> in the URL starts it after loading (add &loop to repeat). Any
// click or key hands the board back.

import * as THREE from 'three'
import { gsap } from 'gsap'
import { DEMO, DRAG } from '../config.js'
import { nameToSquare, squareToWorld, worldToSquare } from '../chess/coords.js'

export function createDemo({ pieces, camera, canvas, sizes, game, dragControls, settings }) {
  const cursor = document.querySelector('.demo-cursor')
  const ring = cursor.querySelector('.ring')
  const pos = { x: sizes.width * 0.5, y: sizes.height * 0.85 }   // where the drawn cursor is, in CSS pixels
  const projected = new THREE.Vector3()
  let token = 0                 // bumped to cancel a running demo
  let carrying = null           // the piece in the cursor's hand, if any
  let restore = null            // settings to put back when the demo ends
  let loopGame = null           // name of the game to replay, or null

  const running = () => restore !== null
  const sleep = (seconds) => new Promise((resolve) => gsap.delayedCall(seconds, resolve))
  const tween = (target, vars) => new Promise((resolve) => gsap.to(target, { ...vars, onComplete: resolve }))

  function project(x, y, z) {
    projected.set(x, y, z).project(camera)
    return { x: (projected.x + 1) / 2 * sizes.width, y: (1 - projected.y) / 2 * sizes.height }
  }

  function draw() {
    cursor.style.transform = `translate(${pos.x}px, ${pos.y}px)`
  }

  function pulse() {
    ring.classList.remove('pulse')
    void ring.offsetWidth                  // restart the CSS animation
    ring.classList.add('pulse')
  }

  function pieceOn(square) {
    const { col, row } = nameToSquare(square)
    return pieces.children.find((p) => !p.userData.captured && p.userData.col === col && p.userData.row === row)
  }

  /** One move, the way a hand would make it. Resolves false if the piece is not there (the script is wrong). */
  async function playMove(from, to, my) {
    const piece = pieceOn(from)
    if (!piece) return false
    const grab = project(piece.position.x, DEMO.grabHeight, piece.position.z)
    await tween(pos, { x: grab.x, y: grab.y, duration: DEMO.approachSeconds, ease: 'power2.inOut', onUpdate: draw })
    if (my !== token) return false

    cursor.classList.add('down')
    pulse()
    carrying = piece
    game.onPickUp(piece)
    await tween(piece.position, { y: DRAG.liftHeight, duration: 0.25, ease: 'power2.out' })

    const { col, row } = nameToSquare(to)
    const { x, z } = squareToWorld(col, row)
    await tween(piece.position, {
      x, z, duration: DEMO.carrySeconds, ease: 'power2.inOut',
      onUpdate: () => {
        const at = project(piece.position.x, piece.position.y, piece.position.z)
        pos.x = at.x
        pos.y = at.y + DEMO.cursorOffset
        draw()
        game.onCarry(piece, worldToSquare(piece.position.x, piece.position.z))
      }
    })
    if (my !== token) return false

    cursor.classList.remove('down')
    pulse()
    carrying = null
    await game.onDrop(piece, worldToSquare(piece.position.x, piece.position.z))
    return true
  }

  async function start(name = DEMO.defaultGame) {
    const script = DEMO.games[name] || DEMO.games[DEMO.defaultGame]
    if (running()) stop()
    const my = ++token
    restore = { opponent: settings.opponent, dragging: dragControls.enabled }
    settings.opponent = 'off'                 // two hands, no computer
    game.reset()
    dragControls.enabled = false
    canvas.style.cursor = 'none'
    document.body.dataset.demo = 'on'
    cursor.hidden = false
    draw()

    await sleep(DEMO.startDelay)
    for (const move of script.moves) {
      if (my !== token) return
      const ok = await playMove(move.slice(0, 2), move.slice(2, 4), my)
      if (!ok || my !== token) break
      await sleep(DEMO.betweenSeconds)
    }
    if (my !== token) return
    finish()
    if (loopGame) {
      await sleep(DEMO.loopDelay)
      if (loopGame && !running()) start(loopGame)
    }
  }

  /** Put the board back in the user's hands. A piece mid-carry is dropped where it is (an illegal spot bounces it home). */
  function stop() {
    if (!running()) return
    token++
    if (carrying) {
      gsap.killTweensOf(carrying.position)
      game.onDrop(carrying, worldToSquare(carrying.position.x, carrying.position.z))
      carrying = null
    }
    finish()
  }

  function finish() {
    gsap.killTweensOf(pos)
    cursor.hidden = true
    cursor.classList.remove('down')
    canvas.style.cursor = ''
    delete document.body.dataset.demo
    dragControls.enabled = restore?.dragging ?? settings.dragging
    if (restore) settings.opponent = restore.opponent
    restore = null
  }

  // ---- ways in and out --------------------------------------------------------

  window.addEventListener('keydown', (event) => {
    if (event.key === 'd' || event.key === 'D') {
      if (running()) { loopGame = null; stop() } else start()
      return
    }
    if (running()) { loopGame = null; stop() }       // any other key: the person wants the board
  })
  canvas.addEventListener('pointerdown', () => { if (running()) { loopGame = null; stop() } })

  const params = new URLSearchParams(window.location.search)
  const page = window.CHESS_DEMO
  if (page || params.has('demo')) {
    const name = params.get('demo') || page?.game || DEMO.defaultGame
    loopGame = params.has('loop') || page?.loop ? name : null
    gsap.delayedCall(1.5, () => start(name))
  }

  return { start, stop, running }
}

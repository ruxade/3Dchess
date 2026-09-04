import { describe, it, expect, vi } from 'vitest'
import { createClock, formatClock } from '../src/chess/clock.js'

describe('clock', () => {
  it('waits for the first move, then runs the other side', () => {
    const clock = createClock({ minutes: 5, increment: 0 })
    clock.tick(10)                                   // nobody has moved: nothing happens
    expect(clock.remaining('light')).toBe(300000)
    clock.press('light')                             // white moved
    clock.tick(2)
    expect(clock.remaining('dark')).toBe(298000)
    expect(clock.remaining('light')).toBe(300000)
    expect(clock.running()).toBe('dark')
  })

  it('adds the increment to the side that just moved', () => {
    const clock = createClock({ minutes: 3, increment: 2 })
    clock.press('light')
    clock.tick(5)
    clock.press('dark')
    expect(clock.remaining('dark')).toBe(180000 - 5000 + 2000)
    expect(clock.running()).toBe('light')
  })

  it('flags once, at zero, and stops', () => {
    const onFlag = vi.fn()
    const clock = createClock({ minutes: 1, increment: 0 }, onFlag)
    clock.press('light')
    clock.tick(59.5)
    expect(clock.flagged()).toBeNull()
    clock.tick(1)
    expect(clock.remaining('dark')).toBe(0)
    expect(clock.flagged()).toBe('dark')
    expect(clock.running()).toBeNull()
    clock.tick(5)
    clock.press('dark')                              // too late, the game is over
    expect(onFlag).toHaveBeenCalledTimes(1)
    expect(onFlag).toHaveBeenCalledWith('dark')
    expect(clock.running()).toBeNull()
  })

  it('switches sides after an undo without refunding time', () => {
    const clock = createClock({ minutes: 5, increment: 0 })
    clock.press('light'); clock.tick(3); clock.press('dark'); clock.tick(2)
    clock.switchTo('dark')                           // black's move was taken back
    expect(clock.running()).toBe('dark')
    expect(clock.remaining('dark')).toBe(297000)
    expect(clock.remaining('light')).toBe(298000)
  })

  it('restores saved times and reset starts fresh', () => {
    const clock = createClock({ minutes: 5, increment: 0 })
    clock.setRemaining({ light: 12345, dark: 500 })
    expect(clock.remaining('light')).toBe(12345)
    expect(clock.running()).toBeNull()               // restored clocks wait for the next move
    clock.reset()
    expect(clock.remaining('dark')).toBe(300000)
  })

  it('a side restored at zero is still flagged', () => {
    const clock = createClock({ minutes: 5, increment: 0 })
    clock.setRemaining({ light: 0, dark: 4000 })
    expect(clock.flagged()).toBe('light')
    clock.press('dark')
    expect(clock.running()).toBeNull()
  })

  it('formats minutes and seconds, tenths under twenty seconds', () => {
    expect(formatClock(300000)).toBe('5:00')
    expect(formatClock(65000)).toBe('1:05')
    expect(formatClock(19900)).toBe('0:19.9')
    expect(formatClock(0)).toBe('0:00.0')
    expect(formatClock(-40)).toBe('0:00.0')
  })
})

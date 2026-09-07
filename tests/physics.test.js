import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { createPhysics } from '../src/physics/world.js'

// A stand-in piece: 0.7 wide, 1.2 tall, base at y = 0 like the real geometry.
function piece(x, z) {
  const geometry = new THREE.BoxGeometry(0.7, 1.2, 0.7)
  geometry.translate(0, 0.6, 0)
  geometry.computeBoundingBox()
  const mesh = new THREE.Mesh(geometry)
  mesh.position.set(x, 0, z)
  return mesh
}

const simulate = (physics, seconds) => { for (let i = 0; i < seconds * 60; i++) physics.step(1 / 60) }

describe('physics', () => {
  it('leaves standing pieces exactly where they are', () => {
    const physics = createPhysics()
    const rook = piece(-3.5, -3.5)
    physics.addPiece(rook)
    simulate(physics, 2)
    expect(rook.position.toArray()).toEqual([-3.5, 0, -3.5])
  })

  it('a knocked piece leaves the board and comes to rest lower than the board top', () => {
    const physics = createPhysics()
    const pawn = piece(-2.5, 0.5)   // b5, with the capturer arriving from a4
    physics.addPiece(pawn)
    physics.knock(pawn, new THREE.Vector3(1, 0, 1).normalize())
    simulate(physics, 4)
    const offBoard = Math.abs(pawn.position.x) > 4 || Math.abs(pawn.position.z) > 4
    expect(offBoard).toBe(true)
    expect(pawn.position.y).toBeLessThan(0)
    expect(pawn.position.y).toBeGreaterThan(-1.2)   // resting on the plate, not falling forever
    expect(Math.hypot(pawn.position.x, pawn.position.z)).toBeLessThan(11)   // and still on the plate
  })

  it('arcs over a standing piece in its way', () => {
    const physics = createPhysics()
    const victim = piece(-2.5, 0.5)
    const bystander = piece(-3.5, 0.5)   // a5, between b5 and the nearest edge
    physics.addPiece(victim)
    physics.addPiece(bystander)
    physics.knock(victim, new THREE.Vector3(1, 0, 1).normalize())
    simulate(physics, 4)
    expect(bystander.position.toArray()).toEqual([-3.5, 0, 0.5])
    expect(Math.abs(victim.position.x) > 4 || Math.abs(victim.position.z) > 4).toBe(true)
  })

  it('the gentlest knock still clears a neighbour and leaves the board', () => {
    const physics = createPhysics()
    const victim = piece(-2.5, 0.5)
    const bystander = piece(-3.5, 0.5)
    physics.addPiece(victim)
    physics.addPiece(bystander)
    physics.knock(victim, new THREE.Vector3(1, 0, 1).normalize(), 0.4)   // the slider's minimum
    simulate(physics, 6)
    expect(bystander.position.toArray()).toEqual([-3.5, 0, 0.5])
    expect(Math.abs(victim.position.x) > 4 || Math.abs(victim.position.z) > 4).toBe(true)
    expect(Math.hypot(victim.position.x, victim.position.z)).toBeLessThan(9)    // and lands closer than a full shove
  })

  it('a piece in the middle of the board gets enough shove to clear it', () => {
    const physics = createPhysics()
    const victim = piece(0.5, 0.5)   // e5, four squares from every edge
    physics.addPiece(victim)
    physics.knock(victim, new THREE.Vector3(0, 0, 1), 0.4)
    simulate(physics, 6)
    expect(Math.abs(victim.position.x) > 4 || Math.abs(victim.position.z) > 4).toBe(true)
    expect(Math.hypot(victim.position.x, victim.position.z)).toBeLessThan(11)
  })

  it('follow() puts the body centre above the base of a piece lying on its side', () => {
    const physics = createPhysics()
    const pawn = piece(6, 1)
    physics.addPiece(pawn)
    pawn.rotation.z = Math.PI / 2          // lying along -x, base at the mesh origin
    physics.follow(pawn)
    const { body, halfHeight } = physics.entries.get(pawn)
    expect(body.position.x).toBeCloseTo(6 - halfHeight, 5)
    expect(body.position.y).toBeCloseTo(0, 5)
    simulate(physics, 1)
    expect(pawn.position.toArray()).toEqual([6, 0, 1])   // static: it stays put
  })

  it('follow() moves a static body with its mesh', () => {
    const physics = createPhysics()
    const knight = piece(0, 0)
    physics.addPiece(knight)
    knight.position.set(2.5, 0, -1.5)
    physics.follow(knight)
    const { body, halfHeight } = physics.entries.get(knight)
    expect([body.position.x, body.position.y, body.position.z]).toEqual([2.5, halfHeight, -1.5])
  })
})

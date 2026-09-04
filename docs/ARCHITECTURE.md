# How the code is organised

Read this once, then keep it open while you work. Every file does one job,
and the job is in the first comment of the file.

## 1. Map

| File | Owns | Touch it when you want to |
| --- | --- | --- |
| `src/main.js` | Wiring. Builds everything, starts the loop. | Add a new module to the app |
| `src/config.js` | Every tunable number and asset path. | Change a colour, size, speed, path |
| `src/chess/coords.js` | Square (col, row) to world (x, z) and back. | Add chess rules, move validation |
| `src/core/sizes.js` | Viewport size, resize event. | Nothing usually |
| `src/core/loading.js` | Progress bar, black fade overlay. | Change the intro |
| `src/core/renderer.js` | WebGLRenderer, post-processing passes. | Add a visual effect (bloom, blur, colour grading) |
| `src/scene/materials.js` | The five matcap materials. | Change how surfaces look |
| `src/scene/board.js` | Plate, 64 squares, grid lines. | Change the board |
| `src/scene/environment.js` | Sky sphere, fog. | Change the mood, the background |
| `src/scene/pieces.js` | Load FBX models, place 32 pieces. | Change models, starting layout |
| `src/scene/showcase.js` | Spinning pieces for camera views 2 to 5. | Change the showcase |
| `src/controls/cameras.js` | Main camera, OrbitControls. | Change how the camera moves |
| `src/controls/drag.js` | Drag a piece, snap to a square. | Change how moving pieces feels |
| `src/controls/views.js` | Keys 1 to 5, key H. | Add a view or a shortcut |
| `src/physics/world.js` | cannon-es world (ground only so far). | Add physics |
| `src/debug/gui.js` | The Settings panel (lil-gui). | Expose a new slider |

`public/` is served at the site root, so `/models/set/fbx/king.fbx` on disk is
`public/models/set/fbx/king.fbx`. `design/` holds the Photoshop source of the icon.

## 2. What happens when the page opens

`main.js` runs top to bottom, in four numbered blocks:

1. **Scene.** One `THREE.Scene`. Into it go the fade overlay, sky sphere, fog,
   board and an empty `pieces` group. A second tiny scene is made for the showcase.
2. **Camera, rendering, controls.** The camera and its orbit controls, the
   renderer with its post-processing chain, drag controls, the empty physics
   world, the settings panel, the view switcher.
3. **Load the pieces.** Async. The six FBX files download (15 MB in total), get
   flattened into six geometries, then 32 meshes are placed. Meanwhile the
   loading bar fills from `LoadingManager` callbacks.
4. **Frame loop.** `tick()` runs about 60 times per second.

## 3. One frame

```
tick()
  dt = clock.getDelta()      seconds since last frame, for physics and animation
  mainCamera.update()        orbit damping, keep the camera inside the sky sphere
  physics.step(dt)           advance the simulation, copy body poses onto meshes
  render(views.current)      view 1 goes through EffectComposer, views 2 to 5 render directly
  requestAnimationFrame(tick)
```

GSAP animations (the showcase spin, the overlay fade) run on their own ticker,
so they do not appear here.

## 4. Coordinates

* y is up. x runs along the files (a to h), z along the ranks (1 to 8).
* The board is centred on the origin. The top face of the squares is `y = 0`.
  A piece standing on the board therefore has `position.y = 0`.
* Square `(col, row)` has its centre at `x = col - 3.5`, `z = row - 3.5`
  (with squareSize 1). `coords.js` does this maths so nobody else has to.
* White (light matcap) starts on rows 0 and 1, black on rows 6 and 7.
  Black pieces are rotated `Math.PI` around y so knights face the enemy.
* Every piece carries `userData = { type, colour, col, row }`. That is the
  whole game state today. A real rules engine would replace it with a proper
  board model and keep the meshes as a view of it.

## 5. Why a piece is a single Mesh

The FBX files come out of the loader as `Group (rotated -90 degrees on x) > Mesh`.
The rotation is how the exporter turned a Z-up model into Y-up.

`loadPieceGeometries()` bakes that rotation, the child offset and the 0.02
scale straight into the vertex positions, once per model type. After that a
piece is one `THREE.Mesh` with a clean transform: `position` is where it stands,
`rotation.y` is which way it faces. Dragging, animating and physics all get
simpler because there is no hidden parent transform to reason about.

All 8 pawns share one geometry on the GPU. `new Mesh(geometry, material)` does
not copy vertex data.

## 6. Adding physics (the recipe)

`physics/world.js` already has a world with gravity and a static ground plane
at `y = 0`. Nothing is linked to it yet, so the game behaves exactly as before.

To make one piece fall and tumble:

```js
import * as CANNON from 'cannon-es'

// 1. A body with a simple shape. Never use the mesh itself as the shape:
//    the king has 535,000 vertices. A cylinder is plenty.
const box = piece.geometry.boundingBox
const radius = (box.max.x - box.min.x) / 2
const height = box.max.y - box.min.y
const body = new CANNON.Body({
  mass: 1,
  shape: new CANNON.Cylinder(radius, radius, height, 12),
  position: new CANNON.Vec3(piece.position.x, height / 2 + 2, piece.position.z)
})

// 2. Cylinder shapes are centred, meshes have their base at y = 0.
//    Shift the shape down so the two line up.
body.shapes[0] = body.shapes[0]
body.shapeOffsets[0].set(0, -height / 2, 0)  // or move the geometry instead, once, in pieces.js

// 3. Link. From now on the mesh follows the body every frame.
physics.link(piece, body)
```

Things you will hit, in order:

1. **Drag versus physics fight.** While a piece is dragged, the body must follow
   the mesh (set `body.position` from `object.position` in the `drag` handler
   and zero its velocity), then on `dragend` the body takes over again.
2. **Board edges.** The ground plane is infinite. Add a `CANNON.Box` for the
   plate, or let pieces fall off the world for fun.
3. **Sound.** `world.addEventListener('collide', ...)` on a body gives you the
   impact; play a click scaled by the impact velocity. There used to be a
   `hit.mp3` in the old `static/` folder (see git history) if you want it back.
4. **Sleep.** `allowSleep` is on, so resting pieces stop simulating. If a piece
   freezes mid-air, wake it with `body.wakeUp()`.

Alternative engine: Rapier (`@dimforge/rapier3d-compat`) is faster and more
accurate but WASM based and a bigger API. cannon-es is the gentler first step.

## 7. Making it more visually interesting

Ranked by payoff for effort. Each one lives in one file.

1. **Hover and selection feedback** (`controls/drag.js`). On `hoveron`, lift the
   piece 0.15 with a GSAP tween and swap to a brighter matcap or add an outline
   pass. On `dragend`, animate the snap instead of teleporting.
2. **Real lighting** (`scene/materials.js`). Swap `MeshMatcapMaterial` for
   `MeshStandardMaterial` plus an environment map from `RoomEnvironment`, turn
   on shadows. The pieces are high-poly, they will look sculptural.
3. **Camera choreography** (`controls/cameras.js`). Intro flythrough with GSAP
   on `camera.position` while the overlay fades; a "look at the piece I am
   holding" nudge during drag.
4. **Captures** (`controls/drag.js` plus a new `scene/effects.js`). When a piece
   lands on an occupied square, the captured piece gets a physics body and is
   knocked off the board. This is where physics pays for itself.
5. **Post-processing** (`core/renderer.js`). Add `OutputPass` at the end of the
   chain for correct colour, then try `SMAAPass` for anti-aliasing, a subtle
   vignette, depth of field for the showcase views.

## 8. Performance note

The models are far heavier than they need to be:

| Piece | Vertices | Count on board |
| --- | --- | --- |
| king | 534,966 | 2 |
| queen | 457,686 | 2 |
| bishop | 162,900 | 4 |
| pawn | 87,744 | 16 |
| knight | 37,032 | 4 |
| rook | 12,888 | 4 |

About 4.2 million vertices per frame, drawn twice when bloom is on. It runs,
but it caps what else you can afford. A chess piece reads perfectly at 5,000
to 10,000 vertices. Decimate in Blender (Decimate modifier, ratio 0.05), export
as glTF binary with Draco compression, and the 15 MB download becomes about
1 MB. Change the paths in `config.js` and swap `FBXLoader` for `GLTFLoader`
with `DRACOLoader` in `pieces.js`. Nothing else needs to know.

## 9. Glossary

* **Scene**: the tree of things to draw. **Group**: a node with children and no shape.
* **Mesh** = Geometry (the shape, vertex data) + Material (how the surface is shaded).
* **Matcap**: a picture of a lit sphere used as a lookup table for shading. No lights needed, fast, stylised.
* **Camera**: where we look from. **OrbitControls**: mouse to camera position.
* **Renderer**: turns scene + camera into pixels. **EffectComposer**: chains full-screen effects (passes) after rendering.
* **LoadingManager**: counts asset downloads so you can show progress.
* **Raycaster**: shoots a line from the mouse into the scene to find what is under it. DragControls uses one.
* **userData**: a free object on every Three.js object for your own data.
* **Body** (cannon-es): the physics twin of a mesh. Has mass, shape, velocity.

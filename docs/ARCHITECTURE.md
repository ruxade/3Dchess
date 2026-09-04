# How the code is organised

Read this once, then keep it open while you work. Every file does one job,
and the job is in the first comment of the file.

## 1. Map

| File | Owns | Touch it when you want to |
| --- | --- | --- |
| `src/main.js` | Wiring. Builds everything, starts the loop. | Add a new module to the app |
| `src/config.js` | Every tunable number and asset path. | Change a colour, size, speed, path |
| `src/chess/coords.js` | Square (col, row) to world (x, z) and back, 'e4' names. | Change board geometry maths |
| `src/chess/rules.js` | The rules (chess.js behind a five-function API). | Change promotion, add variants |
| `src/chess/controller.js` | Applies a legal move to the meshes: capture, castle, promote, bounce back. | Change what a move looks like |
| `src/scene/highlights.js` | Legal-move markers on the board. | Change the markers |
| `src/ui/status.js` | The "White to move" line. | Change messages |
| `src/ui/palette.js` | Colour panel: slots, swatches, presets, localStorage. | Add a preset, a slot |
| `src/ui/help.js` | The controls panel toggle. | Nothing usually |
| `src/ui/gallery.js` | Gallery bar: names, arrows, caption, back. | Change captions (config PIECE_INFO) |
| `tools/decimate.py` | Blender script: FBX sources to light .glb files. | Re-export after editing a model |
| `src/core/sizes.js` | Viewport size, resize event. | Nothing usually |
| `src/core/loading.js` | Progress bar, black fade overlay. | Change the intro |
| `src/core/renderer.js` | WebGLRenderer, post-processing passes. | Add a visual effect (bloom, blur, colour grading) |
| `src/scene/materials.js` | One matcap material per recolourable slot, setMatcap(). | Change how surfaces look |
| `src/scene/board.js` | Plate, 64 squares, grid lines. | Change the board |
| `src/scene/environment.js` | Sky sphere, fog. | Change the mood, the background |
| `src/scene/pieces.js` | Load FBX models, place 32 pieces. | Change models, starting layout |
| `src/scene/gallery.js` | Gallery scene: one piece on a pedestal, own camera and orbit. | Change the gallery look |
| `src/controls/cameras.js` | Main camera, OrbitControls. | Change how the camera moves |
| `src/controls/drag.js` | Carry a piece above the board, hand the drop to the controller. | Change how carrying feels |
| `src/controls/views.js` | Game mode versus gallery mode, key H. | Add a mode |
| `src/physics/world.js` | cannon-es world: static pieces, board, floor, knock(). | Tune how pieces fly |
| `src/physics/debug.js` | Wireframe colliders (Settings, Debug, show colliders). | Nothing usually |
| `src/core/sound.js` | The click sample, volume by impact. | Add sounds |
| `src/debug/gui.js` | The Settings panel (lil-gui). | Expose a new slider |

`public/` is served at the site root, so `/models/set/glb/king.glb` on disk is
`public/models/set/glb/king.glb`. `design/` holds the sources that are not
shipped: the original FBX models and the Photoshop file of the icon.

## 2. What happens when the page opens

`main.js` runs top to bottom, in four numbered blocks:

1. **Scene.** One `THREE.Scene`. Into it go the fade overlay, sky sphere, fog,
   board and an empty `pieces` group. A second small scene is made for the gallery.
   The fog colour is the average colour of the sky matcap, so recolouring the
   sky recolours the haze too.
2. **Camera, rendering, controls.** The camera and its orbit controls, the
   renderer with its post-processing chain, drag controls, the physics world
   (board and floor bodies), the settings panel, the game/gallery switch.
3. **Load the pieces.** Async. The six .glb files download (1.5 MB in total),
   get flattened into six geometries, then 32 meshes are placed. Meanwhile the
   loading bar fills from `LoadingManager` callbacks.
4. **Frame loop.** `tick()` runs about 60 times per second.

## 2b. What happens when you move a piece

```
pointer down on a piece          DragControls raycasts, fires dragstart
  drag.js                        sets the carry plane to the click height, remembers the grab offset,
                                 calls controller.onPickUp(piece)
  controller.onPickUp            asks rules.legalMoves('e2'), highlights.show(...)
pointer moves                    DragControls fires drag
  drag.js                        raycasts to the carry plane, sets piece to (x, liftHeight, z),
                                 calls controller.onCarry(piece, square)
  controller.onCarry             highlights.setTarget(square, legal?) under the piece
pointer up                       DragControls fires dragend
  drag.js                        worldToSquare(x, z), calls controller.onDrop(piece, square)
  controller.onDrop              rules.move('e2', 'e4')
       illegal -> null           flyTo(piece, 'e2'): bounce back
       legal   -> description    settle(piece), capture(...), castle rook, promote
                                 refreshDraggable(): only the other side is grabbable now
                                 status.fromRules(): "Black to move", "Check!", "Checkmate..."
                                 camera.flyToSide(turn): glide behind the player to move
```

Hovering a grabbable piece lifts it a little (onHover). Every settled piece
tells physics.follow() where its body now stands.

Two things keep pieces from overlapping: a carried piece is held at
`DRAG.liftHeight` (above the tallest piece), and a drop is only accepted when
the rules accept it, so a friendly piece can never be landed on and a captured
one leaves the square before the capturer settles.

`window.chess` exposes `rules`, `pieces`, `camera` and `game` in the browser
console. Try `chess.rules.fen()` or `chess.game.reset()`.

## 3. One frame

```
tick()
  dt = clock.getDelta()      seconds since last frame, for physics and animation
  mainCamera.update()        orbit damping, keep the camera inside the sky sphere
                             (gallery.update() instead while the gallery is open)
  physics.step(dt)           advance the simulation, copy dynamic bodies onto meshes
  physicsDebug.sync()        move the wireframes, only while they are visible
  render(views.current)      the game goes through EffectComposer, the gallery renders directly
  requestAnimationFrame(tick)
```

GSAP animations (piece moves, camera glides, the overlay fade) run on their own ticker,
so they do not appear here.

## 4. Coordinates

* y is up. x runs along the files (a to h), z along the ranks (1 to 8).
* The board is centred on the origin. The top face of the squares is `y = 0`.
  A piece standing on the board therefore has `position.y = 0`.
* Square `(col, row)` has its centre at `x = col - 3.5`, `z = row - 3.5`
  (with squareSize 1). `coords.js` does this maths so nobody else has to.
* White (light matcap) starts on rows 0 and 1, black on rows 6 and 7.
  Black pieces are rotated `Math.PI` around y so knights face the enemy.
* Every piece carries `userData = { type, colour, col, row }` so the 3D side
  knows where it stands. The *truth* about the game lives in `rules.js`
  (chess.js). After every move `controller.js` makes the meshes agree with it.

## 5. Why a piece is a single Mesh

`tools/decimate.py` already exports each piece as one mesh, y up, base at
y = 0, centred, at world scale. `loadPieceGeometries()` still bakes any node
transform into the vertex positions, once per model type, so a piece is one
`THREE.Mesh` with a clean transform: `position` is where it stands,
`rotation.y` is which way it faces. Dragging, animating and physics all get
simpler because there is no hidden parent transform to reason about.

(The original FBX files came out of the loader as `Group (rotated -90 degrees
on x) > Mesh`, the exporter's way of turning a Z-up model into Y-up. That is
why the first version of this code had to bake a rotation and a 0.02 scale.)

All 8 pawns share one geometry on the GPU. `new Mesh(geometry, material)` does
not copy vertex data.

## 6. Physics (what is in, how to play with it)

Three.js draws, cannon-es simulates. Every piece has a Body next to its Mesh.

* **Standing pieces are STATIC bodies**: tapered cylinders fitted to the
  bounding box (`PHYSICS.topRadiusRatio`). The simulation never moves them,
  but flying pieces bounce off them. When a piece settles on a new square the
  controller calls `physics.follow(mesh)` so the body catches up.
* **The board is a box** whose top is `y = 0`; **the floor is a plane** at the
  plate top. Nothing falls forever.
* **A capture calls `physics.knock(mesh, travel)`**: the body turns DYNAMIC and
  is shoved towards the nearest board edge, bent a little along the capturer's
  line of travel (`travelWeight`), with `knockSpeed` sideways, `knockLift` up
  (enough to arc over standing pieces) and `knockSpin` end over end. From then on `step()` copies the body's position
  and rotation onto the mesh each frame. `allowSleep` puts it to rest; if it
  dozes off while still on the board it gets one more shove.
* **Impacts make sound**: `body.addEventListener('collide')` reports the impact
  speed, `sound.hit(speed / 8)` plays the click at that volume.
* **Settings, Debug, show colliders** draws every body as a wireframe. Turn it
  on and capture something: you will see exactly what the simulation sees.

Knobs, all in `config.js` under `PHYSICS`: gravity, friction, restitution,
the three knock values. Turn physics off (Settings, Game) and captures glide to
a graveyard beside the board instead, the pre-physics behaviour.

Next steps if you want more:

1. **Dragged piece as a kinematic body** so a carried piece pushes others aside
   (`body.type = KINEMATIC`, set its position from the mesh each frame).
2. **Compound shapes** (a fat base cylinder plus a thin top) for more honest
   tumbling than one tapered cylinder.
3. **Rapier** (`@dimforge/rapier3d-compat`) if you ever need hundreds of bodies;
   faster and more stable, WASM based, bigger API.

## 7. Making it more visually interesting

Ranked by payoff for effort. Each one lives in one file.

1. **Selection feedback** (`chess/controller.js`, `onHover`). The lift is in;
   next: a brighter matcap or an outline pass on the hovered piece.
2. **Real lighting** (`scene/materials.js`). Swap `MeshMatcapMaterial` for
   `MeshStandardMaterial` plus an environment map from `RoomEnvironment`, turn
   on shadows. The palette panel would then pick colours instead of matcaps.
3. **Camera choreography** (`controls/cameras.js`, `flyTo`). The camera already
   glides behind the player to move. Next: an intro flythrough while the overlay
   fades, and a gentle "look at the piece I am holding" nudge during a drag.
4. **Captures** (`chess/controller.js`, `capture()`). Done with physics. Next:
   a little dust puff or a flash on impact (`scene/effects.js`, particles).
5. **Post-processing** (`core/renderer.js`). Add `OutputPass` at the end of the
   chain for correct colour, then try `SMAAPass` for anti-aliasing, a subtle
   vignette, depth of field for the gallery.

## 7b. Tests

`npm test` runs Vitest on the two pure modules: `coords.js` (square maths) and
`rules.js` (the chess.js translation, including en passant, castling,
promotion and checkmate). Everything that touches WebGL is checked by eye.

## 8. Models and performance

The FBX sources in `design/models/fbx` are print-resolution. `tools/decimate.py`
runs Blender headless and writes the game-resolution .glb files:

| Piece | Triangles before | Triangles after | On board |
| --- | --- | --- | --- |
| king | 178,322 | 14,000 | 2 |
| queen | 152,558 | 14,000 | 2 |
| bishop | 54,300 | 9,000 | 4 |
| pawn | 29,248 | 6,000 | 16 |
| knight | 12,344 | 9,000 | 4 |
| rook | 4,296 | 4,296 | 4 |

Per frame: about 1.4 million triangles before, 230 thousand after. Download:
15 MB before, 1.5 MB after. To change the budgets edit `TRIANGLE_BUDGET` in the
script and run:

```bash
/Applications/Blender.app/Contents/MacOS/Blender -b --python tools/decimate.py -- design/models/fbx public/models/set/glb
```

If you ever remodel a piece, export FBX into `design/models/fbx` and rerun.
Draco compression (`DRACOLoader`) could take the 1.5 MB to about 400 KB; not
worth the extra moving parts yet.

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

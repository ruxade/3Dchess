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
| `src/chess/controller.js` | Applies moves to the meshes, runs the computer, undo by resync. | Change what a move looks like |
| `src/chess/engine.js` | The computer opponent: three levels, pure functions on a FEN. | Make it stronger or weaker |
| `src/chess/engine.worker.js` | Runs the engine off the main thread. | Nothing usually |
| `src/chess/opponent.js` | Asks the worker for a move, returns a Promise. | Change thinking time |
| `src/chess/clock.js` | The chess clock: pure, fed by tick(dt). | Change how time is counted |
| `src/core/storage.js` | localStorage with JSON and try/catch. | Nothing usually |
| `src/scene/effects.js` | Particle puffs on knocks and impacts. | Add effects |
| `src/scene/shatter.js` | Shattering captures: cut a piece into shards, fling them. | Change how pieces break |
| `src/scene/highlights.js` | Legal-move markers on the board. | Change the markers |
| `src/ui/status.js` | The "White to move" line. | Change messages |
| `src/ui/palette.js` | Colour panel: slots, swatches, presets, localStorage. | Add a preset, a slot |
| `src/ui/help.js` | The controls panel toggle. | Nothing usually |
| `src/ui/gallery.js` | Gallery bar: names, arrows, caption, back. | Change captions (config PIECE_INFO) |
| `src/ui/moves.js` | Move list, Undo and New buttons. | Change the list |
| `src/ui/promotion.js` | "Promote to" chooser. | Nothing usually |
| `src/ui/clocks.js` | The two clocks, top centre. | Change the clock look |
| `tools/decimate.py` | Blender script: FBX sources to light .glb files. | Re-export after editing a model |
| `src/core/sizes.js` | Viewport size, resize event. | Nothing usually |
| `src/core/loading.js` | Progress bar, black fade overlay. | Change the intro |
| `src/core/renderer.js` | WebGLRenderer, post-processing passes (outline, bloom). | Add a visual effect (blur, colour grading) |
| `src/scene/materials.js` | One matcap material per recolourable slot, setMatcap(). | Change how surfaces look |
| `src/scene/board.js` | Plate, 64 squares, grid lines. | Change the board |
| `src/scene/environment.js` | Sky sphere, fog, the game-over tint. | Change the mood, the background |
| `src/scene/pieces.js` | Load FBX models, place 32 pieces. | Change models, starting layout |
| `src/scene/gallery.js` | Gallery scene: one piece on a pedestal, own camera and orbit. | Change the gallery look |
| `src/scene/victory.js` | Victory scene: the winner's pawn spinning, puffs. | Change the celebration |
| `src/ui/victory.js` | Victory words and buttons. | Change the wording |
| `src/controls/cameras.js` | Main camera, OrbitControls, flights round the board. | Change how the camera moves |
| `src/controls/drag.js` | Carry a piece above the board, hand the drop to the controller. | Change how carrying feels |
| `src/controls/views.js` | Game, gallery and victory modes, key H. | Add a mode |
| `src/physics/world.js` | cannon-es world: static pieces, board, floor, knock(). | Tune how pieces fly |
| `src/physics/debug.js` | Wireframe colliders (Settings, Debug, show colliders). | Nothing usually |
| `src/core/sound.js` | The click sample by impact, the shatter recordings. | Add sounds |
| `src/debug/gui.js` | The Settings panel (lil-gui). | Expose a new slider |
| `src/demo/demo.js` | Self-playing demo: drawn cursor, scripted games, key D and ?demo. | Add a game (config DEMO) |

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
tells physics.follow() where its body now stands. A pawn dropped on the last
rank pauses at `promotionUi.ask()` until you pick a piece (or Escape to cancel).

**Undo** (key U) does not replay moves backwards. It calls `rules.undo()` and
then `syncFromRules()`: compare what the rules say is on each square with the
meshes, keep the ones already right, fly the others where they belong, bring a
knocked piece back from the plate (upright, static again), swap a promoted
queen back into a pawn, and knock off anything that should not be there. The
same function powers `chess.game.load(fen)` from the console.

Two things keep pieces from overlapping: a carried piece is held at
`DRAG.liftHeight` (above the tallest piece), and a drop is only accepted when
the rules accept it, so a friendly piece can never be landed on and a captured
one leaves the square before the capturer settles.

`window.chess` exposes `rules`, `pieces`, `camera`, `game` and `passes` in the
browser console. Try `chess.rules.fen()` or `chess.game.reset()`.

## 2c. Saving, and the clock

After every move, undo, new game and settings change the controller writes one
JSON object to localStorage (`GAME_STORAGE_KEY`): the game as PGN, the
opponent, your colour, the clock preset and the time left on each clock. When
the page opens, `applySavedSettings()` restores the settings before the
Settings panel is built, and `restoreSaved()` loads the PGN and runs
`syncFromRules(true)`, which puts every piece straight onto its square
(captured ones tumble off during the intro flight). A game with no saved state
starts fresh. Storage that throws (private mode) is silently ignored.

The clock (`chess/clock.js`) is pure and knows nothing about the DOM. Nothing
runs until the first move. Each completed move calls `press(colour)`: the
mover's clock stops and gets the increment, the other side starts. `tick(dt)`
is called from the frame loop through `hooks.tick`. At zero the side has
flagged: `onFlag` fires once, the controller treats it like checkmate (nobody
can move, the computer stops thinking, status says who won) and undo is
refused. Undo switches the running clock back without refunding time. A saved
game restores its times but waits for the next move before running, so a tab
left closed overnight does not lose on time. `ui/clocks.js` only touches the
DOM when the text changes.

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
* **A shattering capture** (`scene/shatter.js`) hides the piece, parks its
  body far below the board (`physics.park`) and adds one DYNAMIC box body per
  shard (`physics.addFragment`, origin at the shard's centre so mesh and body
  coincide). The shards are cut from the piece's geometry by three-pinata,
  once per type in idle time after loading (`warmUp`), then cloned per
  capture; cut faces get the piece's matcap darkened. Debris shrinks away
  after `SHATTER.lifeSeconds`; undo removes it and shows the piece again.
* **A knocking capture calls `physics.knock(mesh, travel)`**: the body turns DYNAMIC and
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
the three knock values. `knock()` takes a strength 0..1 (Settings, Game, "knock
strength", default `PHYSICS.knockStrength`): speed and spin scale with it, lift
only partly so the piece still clears its neighbours; the re-shove for a piece
that dozes off on the board uses at least 0.7. Turn physics off (Settings,
Game) and captures glide to a graveyard beside the board instead, the
pre-physics behaviour.

**The end of a game.** `endGame(winner)` runs on checkmate, flag or draw:
`physics.topple()` turns the loser's king dynamic with a nudge and a spin so it
falls forward on its square (its `toppled` flag exempts it from the off-board
re-shove), and `environment.setTint()` fades a colour over the sky matcap, the
plate and the fog (`GAME_OVER.tints`). `standUp()` on undo, load and new game
puts the king back and lifts the tint. A restored finished game does both at once.

**Victory screen.** Checkmate schedules `celebrate()` after `VICTORY.delaySeconds`
(so the mating move lands and the knock settles); a flag calls it sooner. Undo,
new game and load cancel it. `ui/victory.js` writes the words and switches
`views` to the `victory` mode, whose scene (`scene/victory.js`) is the gallery's
recipe without orbit controls: the winner's pawn rises onto a pedestal, spins,
and a second `createEffects()` instance puffs particles. Every view object now
carries `update(dt)`, so the frame loop just calls `views.state.current.update(dt)`.

Next steps if you want more:

1. **Dragged piece as a kinematic body** so a carried piece pushes others aside
   (`body.type = KINEMATIC`, set its position from the mesh each frame).
2. **Compound shapes** (a fat base cylinder plus a thin top) for more honest
   tumbling than one tapered cylinder.
3. **Rapier** (`@dimforge/rapier3d-compat`) if you ever need hundreds of bodies;
   faster and more stable, WASM based, bigger API.

## 7. Making it more visually interesting

Ranked by payoff for effort. Each one lives in one file.

1. **Selection feedback** (`chess/controller.js`, `onHover`). The lift and an
   `OutlinePass` glow on the hovered or carried piece are in (Settings, Look,
   "outline hovered piece"). Next: a brighter matcap for the side to move.
2. **Real lighting** (`scene/materials.js`). Swap `MeshMatcapMaterial` for
   `MeshStandardMaterial` plus an environment map from `RoomEnvironment`, turn
   on shadows. The palette panel would then pick colours instead of matcaps.
3. **Camera choreography** (`controls/cameras.js`, `flyTo`). The intro flight
   and the glide behind the player to move are in. Next: a gentle "look at the
   piece I am holding" nudge during a drag.
4. **Captures** (`chess/controller.js`, `capture()`). Three styles under
   Settings, Game: shatter (default), knock, glide. A camera shake was tried
   and removed: it read as the whole scene vibrating. Next: a slow-motion beat,
   or pre-fractured shards from Blender if the runtime cut ever stutters on a phone.
5. **Post-processing** (`core/renderer.js`). Add `OutputPass` at the end of the
   chain for correct colour, then try `SMAAPass` for anti-aliasing, a subtle
   vignette, depth of field for the gallery.

## 6b. The computer opponent (Settings, Game, "computer plays")

`chess/engine.js` is pure: a FEN string in, `{ from, to, promotion }` out. It
runs in a Web Worker (`engine.worker.js`) so the board never stutters while it
thinks, and inline in tests. Scores are centipawns, positive for the side to move.

1. **Beginner.** A random legal move. Half the time, if a capture exists, it
   takes one. Ten lines.
2. **Casual.** One move ahead. Each move is scored: what it captures, whether
   it gives check, whether it promotes, minus 90 percent of the most valuable
   piece the opponent could take straight back. Plus a little noise so games
   differ. This is "do not hang pieces" without any search.
3. **Club.** Negamax with alpha-beta pruning, captures searched first so the
   pruning bites, a quiescence search at the horizon so it never stops halfway
   through an exchange, and iterative deepening (depth 1, then 2, 3, 4) inside
   a time budget (`OPPONENT.thinkBudgetMs`). The evaluation is material plus a
   small bonus for pieces near the centre and pawns that have advanced.

The controller asks after every human move (`computerMove()`), waits at least
`OPPONENT.minReplyMs` so the answer reads as a move and not a glitch, then feeds
the reply through the same `commit()` path as a human move: the piece flies,
captures knock, the move list updates. Undo takes back both the computer's move
and yours. "you play" swaps colours: as black, the computer opens.

To make it stronger: better piece-square tables (search "PeSTO"), a
transposition table, and king safety in the evaluation. To make it faster:
chess.js spends most of its time building SAN strings, so a move generator of
your own would be the big win.

## 7b. Tests

`npm test` runs Vitest on the pure modules: `coords.js` (square maths),
`rules.js` (the chess.js translation: en passant, castling, promotion, undo,
checkmate, PGN round trip), `clock.js` (first move starts it, increments,
flagging once, undo, restore), `physics/world.js` (a knocked piece leaves the
board and arcs over a bystander) and `engine.js` (legal moves, free queen
taken, mate in one found). Everything that touches WebGL is checked by eye.

## 8. Models and performance

The FBX sources in `design/models/fbx` are print-resolution. `tools/decimate.py`
runs Blender headless and writes the game-resolution .glb files:

| Piece | Triangles before | Triangles after | On board |
| --- | --- | --- | --- |
| king | 178,322 | 14,000 | 2 |
| queen | 152,558 | 14,000 | 2 |
| bishop | 54,300 | 9,000 | 4 |
| pawn | 29,248 | 29,248 (kept whole, her call: the edges go first) | 16 |
| knight | 12,344 | 12,344 (kept whole: its face goes first under any budget) | 4 |
| rook | 4,296 | 4,296 | 4 |

Per frame: about 1.4 million triangles before, 620 thousand after (the sixteen
whole pawns are 470 thousand of those). Download: 15 MB before, 2.4 MB after.
To change the budgets edit `TRIANGLE_BUDGET` in the
script (`None` keeps every triangle) and run:

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

# 3D Chess Game

Welcome to my 3D Chess Game project! This is a personal project where I'm learning to build interactive 3D applications using Three.js. My goal is to combine the strategic depth of chess with the exciting visual appeal of 3D graphics to create a fun experience.

This project started a while ago, as a design exercise and 3D printing experiment where I designed and modeled each piece. As I worked on improving the physical models, I became obsessed with the idea of bringing them to life digitally.

I hope you enjoy it!

## Run it

```bash
npm install
npm run dev       # opens the browser, hot reloads on save
npm run build     # production build into dist/
npm run preview   # serve the production build locally
npm test          # unit tests for the square maths and the rules wrapper
```

Node 22 and npm (`.nvmrc` says so, `netlify.toml` pins it for the Netlify
build). Vite is the only build tool. `.npmrc` sets `legacy-peer-deps`
because three-pinata declares an older Three.js range than the one in use; it
works fine with the current one.

## Controls

* Left drag rotates, scroll zooms, right drag pans.
* Click and drag a piece to move it. Legal squares light up, illegal drops bounce back, captures slide off to the side.
* Only the side to move can be picked up. N starts a new game.
* Captured pieces shatter into shards (cut at runtime, cannon-es physics), or get knocked off the board, or glide to the side: Settings, Game, "captures". The camera glides round behind the player to move.
* Play the computer: Settings, Game, "computer plays" (beginner, casual, club). U undoes, the move list is top left.
* Chess clock: Settings, Game, "clock" (1+0 to 15+10). Run out of time and the game is over.
* The game is saved after every move. Close the tab, come back, carry on.
* A pawn on the last rank asks what it becomes.
* Checkmate or a flag brings up the victory screen: the winner's pawn on a turntable. New game, or back to the board to look at the position.
* Settings, Game, "knock strength" tames or unleashes the captures; "shatter sound" picks the break (it plays once when you change it).
* G opens the gallery: each piece on a turntable, orbit it yourself, left and right arrows to browse.
* P opens the colour panel: pick a surface, pick a matcap, or apply a preset. Your choice is remembered.
* ? shows the controls, H hides the settings panel, N starts a new game, double click for fullscreen.

## Code layout

```
index.html            entry page
src/main.js           wires everything together, start reading here
src/config.js         every tunable number and asset path
src/chess/            coordinates, rules (chess.js), controller, clock, the computer opponent (engine + worker)
src/core/             sizes, loading screen, renderer + post-processing, localStorage wrapper
src/scene/            materials, board, environment, pieces, highlights, effects, gallery scene
src/controls/         camera, drag and drop, view switching
src/physics/          cannon-es world (pieces, board, floor, knock) + collider wireframes
src/ui/               status line, colour panel, help panel, gallery bar, move list, promotion chooser, clocks
src/debug/            settings panel
tests/                Vitest unit tests
public/               static assets served at / (decimated .glb pieces, matcaps, icons)
design/               sources that are not shipped (original FBX models, icon PSD)
tools/decimate.py     Blender script that turns the FBX sources into the .glb files
docs/ARCHITECTURE.md  the walkthrough: how a frame works, how to add physics, ideas
```

## Stack

Three.js, chess.js, GSAP, lil-gui, cannon-es, three-pinata (runtime mesh fracture), Vite, Vitest.

## Credits

Shatter sounds are CC0 recordings from freesound.org, trimmed and normalised:

* destroy: "Rock destroy" by Bertsz, https://freesound.org/s/524312/
* smash: "Concrete SMASH 2" by magnuswaker, https://freesound.org/s/522099/
* crack: "rock1_break_140bpm" by Bsantos, https://freesound.org/s/41284/
* crumble: "Kirkstall Rock Crumble" by rokenjocu, https://freesound.org/s/262118/
* stone: "stone falls and breaks low pitch" by SoundCollectah, https://freesound.org/s/109360/

The chess set is my own design. Code libraries: Three.js (MIT), chess.js
(BSD-2), GSAP (standard no-charge licence), lil-gui, cannon-es, three-pinata
(MIT). The pointer icons are from Icons8 (free with attribution).

## Roadmap

* Visual polish: shattering captures, particles, intro flythrough and hover outline are in. Next: real lighting and shadows.
* Computer opponent: three rules-based levels are in. Next: an opening book, a stronger evaluation.
* Chess rules: done (chess.js), with undo, a promotion chooser, clocks and a saved game. Next: export the PGN.
* Multiplayer, one day.

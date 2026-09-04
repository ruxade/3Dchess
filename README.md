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

Node 22 and npm. Vite is the only build tool.

## Controls

* Left drag rotates, scroll zooms, right drag pans.
* Click and drag a piece to move it. Legal squares light up, illegal drops bounce back, captures slide off to the side.
* Only the side to move can be picked up. N starts a new game.
* Keys 1 to 5 switch camera views (1 is the board, 2 to 5 are single pieces).
* P opens the colour panel: pick a surface, pick a matcap, or apply a preset. Your choice is remembered.
* ? shows the controls, H hides the settings panel, double click for fullscreen.

## Code layout

```
index.html            entry page
src/main.js           wires everything together, start reading here
src/config.js         every tunable number and asset path
src/chess/            coordinates, rules (chess.js), controller that moves the meshes
src/core/             sizes, loading screen, renderer + post-processing
src/scene/            materials, board, environment, pieces, showcase scene
src/controls/         camera, drag and drop, view switching
src/physics/          cannon-es world (extension point, empty so far)
src/ui/               status line, colour panel, help panel
src/debug/            settings panel
tests/                Vitest unit tests
public/               static assets served at / (decimated .glb pieces, matcaps, icons)
design/               sources that are not shipped (original FBX models, icon PSD)
tools/decimate.py     Blender script that turns the FBX sources into the .glb files
docs/ARCHITECTURE.md  the walkthrough: how a frame works, how to add physics, ideas
```

## Stack

Three.js, chess.js, GSAP, lil-gui, cannon-es, Vite, Vitest.

## Roadmap

* Physics: pieces with mass, captures that knock pieces off the board.
* Visual polish: hover feedback, real lighting and shadows, camera choreography.
* Chess rules: done (chess.js). Still to do: choose the promotion piece, undo, clocks.
* Multiplayer, one day.

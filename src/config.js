// Every number you might want to tweak lives here, so the other files stay
// about *behaviour* and this one is about *taste*. Change a value, save,
// Vite hot-reloads the page.

export const BOARD = {
  size: 8,          // squares per side
  squareSize: 1,    // world units per square (everything else is measured in these)
  squareHeight: 1   // the squares are chunky boxes, not flat planes
}

export const PLATE = {
  radiusTop: 13,
  radiusBottom: 12,
  height: 1
}

// The FBX files are exported in centimetres, so 0.02 brings a piece to
// roughly 1.2 to 1.8 world units tall (a bit taller than a square is wide).
export const PIECE_SCALE = 0.02

export const PIECE_MODELS = {
  pawn: '/models/set/fbx/pawn.fbx',
  rook: '/models/set/fbx/rook.fbx',
  knight: '/models/set/fbx/knight.fbx',
  bishop: '/models/set/fbx/bishop.fbx',
  queen: '/models/set/fbx/queen.fbx',
  king: '/models/set/fbx/king.fbx'
}

// Standard chess back rank, read from file a to file h.
export const BACK_RANK = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook']

// Matcaps are "material capture" images: a lit sphere baked into a picture.
// MeshMatcapMaterial samples it by surface normal, so no lights are needed.
export const MATCAPS = {
  light: '/textures/matcaps/17.png',       // white pieces
  dark: '/textures/matcaps/32.png',        // black pieces
  plate: '/textures/matcaps/6.png',        // round plate under the board
  background: '/textures/matcaps/34.png',  // inside of the sky sphere
  display: '/textures/matcaps/26.png'      // pieces in the showcase views
}

export const FOG = {
  color: 0xcac0e5,
  density: 0.03
}

export const WORLD_RADIUS = 30   // radius of the sky sphere, camera stays inside

export const CAMERA = {
  fov: 55,
  near: 0.1,
  far: 100,
  position: { x: 9, y: 5, z: 9 }
}

export const POST_FX = {
  bloomStrength: 0.15,
  bloomEnabled: true,
  dotScreenEnabled: false
}

// Camera views 2 to 5 sit at the centre of a small sphere and each looks at
// one slowly spinning piece. `y` nudges the piece so it is vertically centred.
export const SHOWCASE = {
  sphereRadius: WORLD_RADIUS / 3,
  spinSeconds: 3.5,
  pieces: [
    { key: '2', type: 'bishop', position: { x: 0, y: -0.75, z: -2.5 } },
    { key: '3', type: 'queen', position: { x: 0, y: -0.8, z: 2.5 } },
    { key: '4', type: 'rook', position: { x: 2.5, y: -0.5, z: 0 } },
    { key: '5', type: 'knight', position: { x: -2.5, y: -0.5, z: 0 } }
  ]
}

export const LOADING = {
  fadeDelay: 0.5,    // seconds to wait after the last asset lands
  fadeDuration: 3    // seconds for the black overlay to fade out
}

export const DRAG = {
  liftHeight: 2.0,       // taller than the king (1.83), so a carried piece clears everything
  snapSeconds: 0.2,      // settle onto the square after release
  returnSeconds: 0.45    // fly back after an illegal drop
}

export const GRAVEYARD = {
  firstColumnX: 5.5,     // captured pieces line up beside the board, two columns per side
  columnGap: 1,
  perColumn: 8
}

export const HIGHLIGHT = {
  move: 0xffffff,
  capture: 0xff7a45,
  origin: 0xcac0e5
}

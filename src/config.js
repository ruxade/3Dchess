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

// Decimated glTF binaries made by tools/decimate.py from the FBX sources in
// design/models/fbx. Already at world scale: a pawn is 1.19 units tall.
export const PIECE_MODELS = {
  pawn: '/models/set/glb/pawn.glb',
  rook: '/models/set/glb/rook.glb',
  knight: '/models/set/glb/knight.glb',
  bishop: '/models/set/glb/bishop.glb',
  queen: '/models/set/glb/queen.glb',
  king: '/models/set/glb/king.glb'
}

// Standard chess back rank, read from file a to file h.
export const BACK_RANK = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook']

// Matcaps are "material capture" images: a lit sphere baked into a picture.
// MeshMatcapMaterial samples it by surface normal, so no lights are needed.
// The files live in public/textures/matcaps/<id>.png.
export const MATCAP_IDS = [
  1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22,
  23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 45, 46
]
export const matcapUrl = (id) => `/textures/matcaps/${id}.png`

// Every surface that can be recoloured, with the label the palette panel shows.
export const MATERIAL_SLOTS = {
  lightPieces: 'White pieces',
  darkPieces: 'Black pieces',
  lightSquares: 'Light squares',
  darkSquares: 'Dark squares',
  plate: 'Plate',
  sky: 'Sky',
  display: 'Gallery piece'
}

// Curated combinations. The first one is the default look.
export const PALETTES = {
  'Lilac dusk': { lightPieces: 17, darkPieces: 32, lightSquares: 17, darkSquares: 32, plate: 6, sky: 34, display: 26 },
  'Marble hall': { lightPieces: 14, darkPieces: 11, lightSquares: 12, darkSquares: 22, plate: 13, sky: 35, display: 3 },
  'Ember': { lightPieces: 4, darkPieces: 24, lightSquares: 16, darkSquares: 31, plate: 19, sky: 36, display: 26 },
  'Lagoon': { lightPieces: 30, darkPieces: 23, lightSquares: 2, darkSquares: 21, plate: 27, sky: 33, display: 25 }
}
export const DEFAULT_PALETTE = 'Lilac dusk'
export const PALETTE_STORAGE_KEY = '3dchess.palette'

export const FOG = {
  color: 0xcac0e5,
  density: 0.03
}

export const WORLD_RADIUS = 30   // radius of the sky sphere, camera stays inside

export const CAMERA = {
  fov: 55,
  near: 0.1,
  far: 100,
  position: { x: 0, y: 22, z: -26 },     // where the intro flight starts: far and high
  sides: {                                // behind the player, steep but not straight down
    light: { x: 0, y: 10.5, z: -7.5 },
    dark: { x: 0, y: 10.5, z: 7.5 }
  },
  flySeconds: 1.4,
  introSeconds: 3.5
}

export const POST_FX = {
  bloomStrength: 0.15,
  bloomEnabled: true,
  dotScreenEnabled: false
}

// The gallery (key G): one piece at a time on a turntable, orbit it yourself.
export const GALLERY = {
  sphereRadius: 12,
  fov: 40,
  autoRotateSpeed: 1.2,
  order: ['pawn', 'rook', 'knight', 'bishop', 'queen', 'king'],
  first: 'queen'
}

// Caption text for the gallery. Edit freely.
export const PIECE_INFO = {
  pawn: { name: 'Pawn', line: 'The foot soldier. Eight per side, one square forward, captures diagonally.' },
  rook: { name: 'Rook', line: 'Straight lines, any distance. Castles with the king.' },
  knight: { name: 'Knight', line: 'The only piece that jumps: two squares one way, one across.' },
  bishop: { name: 'Bishop', line: 'Diagonals only, so it never leaves the colour it started on.' },
  queen: { name: 'Queen', line: 'Rook and bishop in one. The most powerful piece on the board.' },
  king: { name: 'King', line: 'One square in any direction. Lose it and the game is over.' }
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

export const PHYSICS = {
  gravity: -9.82,
  friction: 0.4,
  restitution: 0.25,
  topRadiusRatio: 0.55,  // a piece's collider is a tapered cylinder: narrower at the top
  knockSpeed: 5,         // horizontal speed given to a captured piece
  knockLift: 6.5,        // upward speed: high enough to arc over standing pieces
  knockSpin: 6,          // tumble
  travelWeight: 0.6      // how much the capturer's line of travel bends the shove (0 = straight to the nearest edge)
}

export const HOVER = {
  lift: 0.12,
  seconds: 0.25
}

export const EFFECTS = {
  burstCount: 28,
  burstLife: 0.7,       // seconds
  burstColour: 0xd6c5ec,
  impactThreshold: 2.5  // impact speed that earns a second puff
}

// The computer opponent. Levels are explained in docs/ARCHITECTURE.md section 9.
export const OPPONENT = {
  levels: ['off', 'beginner', 'casual', 'club'],
  thinkBudgetMs: { beginner: 0, casual: 0, club: 1500 },
  minReplyMs: 650   // even an instant answer waits this long, so it reads as a move, not a glitch
}

export const PROMOTION_CHOICES = ['queen', 'rook', 'bishop', 'knight']

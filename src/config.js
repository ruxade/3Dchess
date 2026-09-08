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

// When a game ends: the loser's king topples and the world changes colour.
// Tints multiply the sky, fog and plate (white = untouched); they lift on a new game.
export const GAME_OVER = {
  tints: {
    light: 0xffd0a0,    // white wins: warm amber evening
    dark: 0x8d86cc,     // black wins: cool indigo night
    draw: 0xb3aebb      // stalemate or draw: grey
  },
  tintSeconds: 1.6,
  topplePush: 1.5       // impulse at the top of the king, sideways: tips it over, lands about a square on
}

// The victory screen: the winner's pawn on a turntable, after a checkmate or a flag.
export const VICTORY = {
  delaySeconds: 1.8,     // let the mating move land and the knock settle first
  spinSpeed: 1.4,        // radians per second
  burstEvery: 0.6,       // seconds between particle puffs
  camera: { height: 0.95, distance: 2.6 }   // multiples of the pawn's height
}

// Caption text for the gallery: how the piece moves, then where it came from. Edit freely.
export const PIECE_INFO = {
  pawn: {
    name: 'Pawn',
    line: 'The foot soldier. Eight per side, one square forward, captures diagonally.',
    history: 'Began as the padati, the foot soldier of chaturanga in sixth century India. For centuries a pawn reaching the far side became only a counsellor; the queen it turns into today came with the queen’s new powers around 1475.'
  },
  rook: {
    name: 'Rook',
    line: 'Straight lines, any distance. Castles with the king.',
    history: 'From the Persian rukh, a chariot. Medieval Italians heard rocca, a fortress, and carved a tower, which is why English also calls it the castle.'
  },
  knight: {
    name: 'Knight',
    line: 'The only piece that jumps: two squares one way, one across.',
    history: 'The horse of chaturanga. Its jump is the one move on the board that has not changed in fifteen hundred years.'
  },
  bishop: {
    name: 'Bishop',
    line: 'Diagonals only, so it never leaves the colour it started on.',
    history: 'Once the elephant: al-fil in Arabic, alfil in Spanish. It jumped exactly two squares diagonally until Europe gave it the open diagonal around 1475. The French call it the fool, the Germans the runner.'
  },
  queen: {
    name: 'Queen',
    line: 'Rook and bishop in one. The most powerful piece on the board.',
    history: 'Started as the vizier, moving one square diagonally, the weakest piece of all. Around 1475 it gained the rook’s and the bishop’s moves at once, and Italians called the new game chess of the mad queen.'
  },
  king: {
    name: 'King',
    line: 'One square in any direction. Lose it and the game is over.',
    history: 'Shah in Persian. Checkmate comes from shah mat, the king is helpless. Its single step has never changed; castling was only settled in the seventeenth century.'
  }
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
  knockReach: { min: 1.2, max: 4.5 },   // how far past the board edge a knocked piece lands, at strength 0 and 1
  knockLift: 5.5,        // upward speed at strength 1: high enough to arc over standing pieces
  knockSpin: 4,          // tumble at strength 1
  knockDamping: { linear: 0.5, angular: 0.9 },    // air and rolling resistance: high, so a piece stops where it lands
  knockSpeedFactor: 1.5,                           // extra launch speed to cover that damping in flight
  knockStrength: 0.55,   // default for the Settings slider: 1 is the full shove, lower is a nudge
  travelWeight: 0.6      // how much the capturer's line of travel bends the shove (0 = straight to the nearest edge)
}

// Shattering captures (Settings, Game, captures: shatter). The taken piece is
// cut into shards at runtime (three-pinata), one physics body each.
export const SHATTER = {
  fragmentsPerUnit: 5,  // shards per unit of piece height: a pawn breaks into 6, a king into 9
  minFragments: 5,
  insideShade: 0.55,    // the cut faces use the piece's own matcap, darkened by this
  spread: 2.2,          // outward speed of the shards, at knock strength 1
  carry: 1.5,           // how much of the capturer's direction the shards keep
  lift: 3.0,            // upward speed
  spin: 10,             // radians per second, at strength 1
  lifeSeconds: 6,       // debris lies around this long
  fadeSeconds: 0.6,     // then shrinks away
  // Recordings for the break, all CC0 from freesound.org (credits in the README).
  // Settings, Game, "shatter sound" picks one.
  sounds: {
    destroy: '/sounds/shatter-destroy.mp3',
    smash: '/sounds/shatter-smash.mp3',
    crack: '/sounds/shatter-crack.mp3',
    crumble: '/sounds/shatter-crumble.mp3',
    stone: '/sounds/shatter-stone.mp3'
  },
  defaultSound: 'destroy'
}

export const CAPTURE_STYLES = ['knock', 'shatter', 'glide']

// The self-playing demo (/demo, key D, or ?demo=<name> in the URL, add &loop to
// repeat). A drawn cursor drags pieces and clicks the panels. A script is a list
// of steps: { move: 'e2e4' }, { click: '<css selector>', pause: seconds },
// { wait: seconds }. A plain `moves` list is a script of moves only.
export const DEMO = {
  defaultGame: 'tour',
  games: {
    tour: {
      name: 'The tour: a few moves, the gallery, the colours',
      steps: [
        { move: 'e2e4' }, { move: 'd7d5' }, { move: 'e4d5' }, { move: 'd8d5' },
        { click: '.fab-gallery', pause: 2.6 },
        { click: '.gallery-bar .chip[data-type="knight"]', pause: 2.6 },
        { click: '.gallery-bar .arrow[data-step="1"]', pause: 2.2 },
        { click: '.gallery-bar .back', pause: 1.4 },
        { click: '.fab-palette', pause: 1.0 },
        { click: '[data-preset="Marble hall"]', pause: 1.6 },
        { click: '[data-preset="Ember"]', pause: 1.6 },
        { click: '.slot[data-slot="sky"]', pause: 0.8 },
        { click: '.swatch[data-id="33"]', pause: 1.8 },
        { click: '.palette .close', pause: 0.8 },
        { move: 'b1c3' }
      ]
    },
    legal: {
      name: "Legal's mate, Paris 1750",
      moves: ['e2e4', 'e7e5', 'g1f3', 'd7d6', 'f1c4', 'c8g4', 'b1c3', 'g7g6', 'f3e5', 'g4d1', 'c4f7', 'e8e7', 'c3d5']
    },
    opera: {
      name: 'The Opera Game, Morphy, Paris 1858',
      moves: ['e2e4', 'e7e5', 'g1f3', 'd7d6', 'd2d4', 'c8g4', 'd4e5', 'g4f3', 'd1f3', 'd6e5', 'f1c4', 'g8f6', 'f3b3', 'd8e7',
        'b1c3', 'c7c6', 'c1g5', 'b7b5', 'c3b5', 'c6b5', 'c4b5', 'b8d7', 'e1c1', 'a8d8', 'd1d7', 'd8d7', 'h1d1', 'e7e6',
        'b5d7', 'f6d7', 'b3b8', 'd7b8', 'd1d8']
    }
  },
  startDelay: 2.2,        // seconds after the reset before the first move
  approachSeconds: 0.7,   // cursor travels to the piece
  clickSeconds: 0.55,     // cursor travels to a button
  carrySeconds: 0.9,      // piece travels to its square
  betweenSeconds: 2.0,    // pause after a move (the camera glide takes 1.4)
  grabHeight: 0.7,        // where on the piece the cursor lands, in world units
  cursorOffset: 6,        // pixels below the carried piece's centre
  loopDelay: 9            // seconds on the victory screen before a looping demo starts over
}

export const HOVER = {
  lift: 0.12,
  seconds: 0.25,
  outline: {                // glow around the piece under the cursor (OutlinePass)
    colour: 0xffffff,       // white reads on every palette; softer values vanish on the light pieces
    hidden: 0x6a5a80,       // the part of the outline behind other pieces
    strength: 8,
    glow: 0.8,
    thickness: 2.5
  }
}

export const EFFECTS = {
  burstCount: 28,
  burstLife: 0.7,       // seconds
  burstSize: 0.14,      // world units; the dot is a soft radial glow, so it reads smaller
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

// Chess clocks (Settings, Game, "clock"). 'minutes' each, plus 'increment'
// seconds added after every move. 'off' is no clock at all.
export const CLOCK = {
  presets: {
    off: null,
    '1+0': { minutes: 1, increment: 0 },
    '3+2': { minutes: 3, increment: 2 },
    '5+0': { minutes: 5, increment: 0 },
    '10+0': { minutes: 10, increment: 0 },
    '15+10': { minutes: 15, increment: 10 }
  },
  lowSeconds: 20    // under this the time turns orange
}

// The game in progress is written to localStorage after every move, so a
// refresh or a closed tab does not lose it.
export const GAME_STORAGE_KEY = '3dchess.game'

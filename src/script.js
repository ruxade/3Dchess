import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { gsap } from 'gsap'
import * as dat from 'dat.gui'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { fog } from 'three/src/nodes/TSL.js'
import  CANNON  from "cannon"
import { DragControls } from 'three/examples/jsm/controls/DragControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { DotScreenPass } from 'three/examples/jsm/postprocessing/DotScreenPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

// -----------------------------------------

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()
const scene2 = new THREE.Scene()

// AXIS HELPER
const axesHelper = new THREE.AxesHelper(3)
scene2.add(axesHelper)


// Active Scene and Camera
let activeScene = scene
// let activeCamera = camera
// let activeControls = orbitControls





// DEBUG
const gui = new dat.GUI({
  closed: true,
  width: 180
  // color: 'white'
})



// CURSOR
const cursor = {
  x: 0,
  y:0
}

window.addEventListener ('mousemove', (event) => {
    cursor.x = event.clientX / sizes.width - 0.5
    cursor.y = - (event.clientY / sizes.height - 0.5)
})

// SIZES
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

window.addEventListener('resize', () =>
{
  // Update sizes
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  // Update camera
  activeCamera.aspect = sizes.width / sizes.height
  activeCamera.updateProjectionMatrix()

  // Update renderer
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})




// ----------------------------------------------------------------------------------

// FOG
// const fog2  = new THREE.Fog( '00ffff', 15, 25) //color, near, far
// scene2.fog = fog2

const fogSettings = {
  fogColor: 0xcac0e5,
  fogDensity: 0.03 // Initial density value
}
const fog1 = new THREE.FogExp2( fogSettings.fogColor, fogSettings.fogDensity )
scene.fog = fog1


// gui.add(fogSettings.density, 0, 1, 0.01).onChange((value) => {
//   fog.density = value // Update the fog density dynamically
// })
gui
    .add(fogSettings, 'fogDensity', 0, 0.15, 0.01)
    .onChange( (value) => {
      fog1.density = value
    })
gui
    .addColor(fogSettings, 'fogColor')
    .onChange( (value) => {
      scene.fog.color.set(value)
    })


    // LOADING

  const loadingBarElement = document.querySelector('.loading-bar')



const loadingManager = new THREE.LoadingManager(
  () =>{
    gsap.delayedCall(0.5, () =>
      {
        gsap.to(overlayMaterial.uniforms.uAlpha, {duration: 3, value : 0})
        loadingBarElement.classList.add('ended')
        loadingBarElement.style.transform =''
    })
  },

  (itemUrl, itemsLoaded, itemsTotal) =>{

    const progressRatio =  itemsLoaded / itemsTotal
    loadingBarElement.style.transform = `scaleX(${progressRatio})`
    console.log(progressRatio)

    }
  )





// OVERLAY

const overlayGeometry = new THREE.PlaneGeometry(2, 2, 1, 1)
const overlayMaterial = new THREE.ShaderMaterial ({
  // wireframe: true,
  transparent: true,
  uniforms:
  {
    uAlpha: { value: 1 }
  },
  vertexShader: `
    void main ()
    {
    gl_Position =  vec4(position, 1.0);
    }`,
    fragmentShader:`
    uniform float uAlpha;
    void main ()
    {

      gl_FragColor = vec4(0.0, 0.0, 0.0, uAlpha);
    }`
})

const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial)
scene.add(overlay)








// LIGHTS
// const ambientLight = new THREE.AmbientLight(0xffffff, 0.5) // Color, intensity
// gui.add(ambientLight, 'intensity').min(0).max(1).step(0.1)
// scene.add(ambientLight)

// const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
// directionalLight.position.set(4, 4, 0)

// gui.add(directionalLight, 'intensity').min(0).max(1).step(0.1)

// scene.add(directionalLight)

// const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 1)
// scene.add(directionalLightHelper)

// const pointLight = new THREE.PointLight(0xffffff, 10, 100); // Color, intensity, distance
// pointLight.position.set(5, 5, 5)
// scene.add(pointLight)

// const pointLightHelper = new THREE.PointLightHelper(pointLight, 1) // POINT LIGHT HELPER
// scene.add(pointLightHelper)

// ----------------------------------------------------------------------------------


// ----------------------------------------------------------------------------------

// TEXTURES and MATERIALS
const textureLoader = new THREE.TextureLoader(loadingManager)

// LIGHT and DARK
const darkTexture = textureLoader.load('/textures/matcaps/32.png')
const lightTexture = textureLoader.load('/textures/matcaps/17.png')

const displayTexture = textureLoader.load('/textures/matcaps/26.png')
// const boardTexture = textureLoader.load('/textures/checkerboard-8x8.png')
// boardTexture.repeat.x = 8
// boardTexture.repeat.y = 8
// boardTexture.wrapS = THREE.MirroredRepeatWrapping
// boardTexture.wrapT = THREE.MirroredRepeatWrapping
// boardTexture.offset.set(0.5, 0.5)
// boardTexture.magFilter  =THREE.NearestFilter

darkTexture.magFilter  =THREE.NearestFilter

const darkMaterial = new THREE.MeshMatcapMaterial({
  matcap: darkTexture,
  // side: THREE.FrontSide,  // Set the side to render
  flatShading: false,     //  enables flat shading for a more stylized look
  // roughness: 0.8,
  // metalness: 0.1

})

const lightMaterial = new THREE.MeshMatcapMaterial({
  matcap: lightTexture,
  // side: THREE.FrontSide,
  flatShading: false
})


const displayMaterial = new THREE.MeshMatcapMaterial({
  matcap: displayTexture,
  // side: THREE.FrontSide,  // Set the side to render
  flatShading: false
})

// SPHERE
const backgroundTexture = textureLoader.load('/textures/matcaps/34.png')

const sphereRadius = 30
const sphereCenter = new THREE.Vector3(0, 0, 0)

const backgroundMaterial = new THREE.MeshMatcapMaterial({
  matcap: backgroundTexture,
  flatShading: false,
  // roughness: 0.9,
  // metalness: 0.1
})
// const boardMaterial = new THREE.MeshBasicMaterial({map : boardTexture})

// const backgroundGeometry = new THREE.SphereGeometry(sphereRadius, 64, 32); // A large sphere
// const backgroundMesh = new THREE.Mesh(backgroundGeometry, backgroundMaterial)
// backgroundGeometry.scale(-1, 1, 1)
// backgroundMesh.position.set(0, 0, 0)

// scene.add(backgroundMesh)

function createBackgroundSphere(radius, scene) {
  const geometry = new THREE.SphereGeometry(radius, 64, 32);
  geometry.scale(-1, 1, 1); // Flip the sphere to have it inside-out
  const mesh = new THREE.Mesh(geometry, backgroundMaterial);
  mesh.position.set(0, 0, 0);
  scene.add(mesh);
  return mesh;
}
createBackgroundSphere(sphereRadius, scene)
const displaySphere = createBackgroundSphere(sphereRadius / 3, scene2)




// CILINDER
const plateTexture = textureLoader.load('/textures/matcaps/6.png')
// groundTexture.repeat.x = 8
// groundTexture.repeat.y = 8
// plateTexture.wrapS = THREE.RepeatWrapping // Enable wrapping on the S (horizontal) axis
// plateTexture.wrapT = THREE.RepeatWrapping // Enable wrapping on the T (vertical) axis
// plateTexture.repeat.set(0.1, 0.1)
plateTexture.magFilter  =THREE.NearestFilter

// FLOOR
const floorGeometry = new THREE.CylinderGeometry(
    13, // radiusTop
    12, // radiusBottom
    1, // height
    64, // radialSegments
    12,
    false)
const plateMaterial = new THREE.MeshMatcapMaterial({
  matcap : plateTexture,
  flatShading: false,
  // roughness: 0.8,
  // metalness: 0.9
})
// const floorMaterial = new THREE.MeshStandardMaterial({
//   color: '#ffffff',
//   roughness: 0.8,
//   metalness: 0.2
// })
const floor = new THREE.Mesh(floorGeometry, plateMaterial)
floor.rotation.y = - Math.PI / 2
floor.position.set(0,-1,0)

scene.add(floor)


const boardSize = 8
const squareSize = 1
const geometry = new THREE.BoxGeometry(squareSize, 1, squareSize)

// const square = new THREE.Mesh(geometry, darkMaterial)
// scene.add(square)
const board = new THREE.Group

  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
    const isDarkSquare = (row + col) % 2 === 0

    const material = isDarkSquare ? darkMaterial : lightMaterial
    const square = new THREE.Mesh(geometry, material)

    square.position.set(
      col - boardSize / 2 + 0.5,
       0,
       row - boardSize / 2 + 0.5)

  board.add(square)
  }}
board.position.set(0, -0.5, 0)

scene.add(board)



// ----------------------------------------------------------------------------------


// LOADER FBX

const fbxLoader = new FBXLoader(loadingManager)



// Paths to the models
const modelPaths = {
  pawn: '/models/set/fbx/pawn.fbx',
  bishop: '/models/set/fbx/bishop.fbx',
  knight: '/models/set/fbx/knight.fbx',
  rook: '/models/set/fbx/rook.fbx',
  king: '/models/set/fbx/king.fbx',
  queen: '/models/set/fbx/queen.fbx'
}

const meshGroup = new THREE.Group()
scene.add(meshGroup)

const loadedModels = {}

const loadModel = (modelName, modelPath, onComplete) => {
  fbxLoader.load(
    modelPath,
    (object) => {
      object.traverse((child) => {
        if (child.isMesh) {
          // child.geometry.computeVertexNormals()
          child.geometry.computeBoundingBox()
        }
      })
      loadedModels[modelName] = object


      if (onComplete) onComplete()
    },
    undefined,
    (error) => {
      console.error(`Error loading ${modelName}:`, error)
    }
  )
}

//  clone and position models
const addPieceToScene = (modelName, position, material, rotate = false) => {
  const modelClone = loadedModels[modelName].clone()

  modelClone.traverse((child) => {
    if (child.isMesh) {
      child.material = material

    }
  })
  modelClone.scale.set(scale, scale, scale)
  modelClone.position.set(position.x, position.y, position.z)

  if (rotate) {
    modelClone.rotation.z = Math.PI
  }
  scene.add(modelClone)


  meshGroup.add(modelClone)
}


const scale = 0.02



const positions = [
  { model: 'pawn', position: { x: 0, y: 0, z: 1 } },
  { model: 'pawn', position: { x: 1, y: 0, z: 1 } },
  { model: 'pawn', position: { x: 2, y: 0, z: 1 } },
  { model: 'pawn', position: { x: 3, y: 0, z: 1 } },
  { model: 'pawn', position: { x: 4, y: 0, z: 1 } },
  { model: 'pawn', position: { x: 5, y: 0, z: 1 } },
  { model: 'pawn', position: { x: 6, y: 0, z: 1 } },
  { model: 'pawn', position: { x: 7, y: 0, z: 1 } },

  { model: 'rook', position: { x: 0, y: 0, z: 0 } },
  { model: 'knight', position: { x: 1, y: 0, z: 0 } },
  { model: 'bishop', position: { x: 2, y: 0, z: 0 } },
  { model: 'king', position: { x: 3, y: 0, z: 0 } },
  { model: 'queen', position: { x: 4, y: 0, z: 0 } },
  { model: 'bishop', position: { x: 5, y: 0, z: 0 } },
  { model: 'knight', position: { x: 6, y: 0, z: 0 } },
  { model: 'rook', position: { x: 7, y: 0, z: 0 } }
]

// UPDATE POSITIONS
const offset = 4
positions.map(({ model, position }) => {
  position.x -= offset
  position.z -= offset
})

// Load all models
Object.entries(modelPaths).forEach(([modelName, modelPath]) => {
  loadModel(modelName, modelPath, () => {
    if (Object.keys(loadedModels).length === Object.keys(modelPaths).length) {

      const centeredPosition = (coord) => coord + 0.5


      // Add first set to the scene
      positions.forEach(({ model, position }) => {
        position.x = centeredPosition(position.x)
        position.z = centeredPosition(position.z)

        addPieceToScene(model, position, darkMaterial, false)

      })


      // Add mirrored set to the scene with light material
      positions.forEach(({ model, position }) => {


        const mirroredPosition = { x: - position.x, y: position.y, z: - position.z }
        addPieceToScene(model, mirroredPosition, lightMaterial, true);
      })
    }

  })
})

//SCENE 2

// console.log( loadedModels)
const loadedDisplayModels = {}

const positionsScene2 = [
  { model: 'queen', position: { x: 0, y: -0.8, z: 2.5 } },
  { model: 'bishop', position: { x: 0, y: -0.75, z: -2.5 } },
  { model: 'rook', position: { x: 2.5, y: -0.5, z: 0 } },
  { model: 'knight', position: { x: -2.5, y: -0.5, z: 0 } },

  // { model: 'pawn', position: { x: -2.5, y: 0, z: 0 } },
  // { model: 'king', position: { x: 3, y: 0, z: 0 } },

]

const loadAndAddModelToScene2 = (modelName, position) => {
  loadModel(modelName, modelPaths[modelName], () => {
    const modelClone = loadedModels[modelName].clone()

    modelClone.scale.set(scale, scale, scale)
    modelClone.position.set(position.x, position.y, position.z)
    modelClone.rotation.z = Math.PI

    modelClone.traverse((child) => {
      if (child.isMesh) {
        child.material = displayMaterial;
      }
    });

    loadedDisplayModels[modelName] = modelClone
    scene2.add(modelClone)


    gsap.to(modelClone.rotation, {
      z: modelClone.rotation.z - Math.PI * 2,
      duration: 3.5,
      repeat: -1,   // Repeat indefinitely
      ease: "none", // Linear rotation (no easing)
    });

  })
}

const displayModels = ['queen', 'bishop', 'rook']
positionsScene2.forEach(({ model, position }) => {
  loadAndAddModelToScene2(model, position)

})


// ----------------------------------------------------------------------------------

// CAMERA
// Base camera
const aspectRatio = sizes.width / sizes.height
const camera = new THREE.PerspectiveCamera(55, aspectRatio, 0.1, 100) // fov , aspect, near, far
// ortho CAMERA
// const camera = new THREE.OrthographicCamera(-1 * aspectRatio, 1 * aspectRatio, 1, -1, 0.1, 100)
camera.position.x = 9
camera.position.y = 5
camera.position.z = 9
const lookAtTarget = new THREE.Vector3(0, 0, 0);
camera.lookAt(lookAtTarget)
scene.add(camera)
// const helper = new TH2REE.CameraHelper( camera )
// scene.add( helper )

const lookAtQueen = new THREE.Vector3(0, 0, -5);
const camera2 = new THREE.PerspectiveCamera(55, aspectRatio, 0.1, 100)
camera2.position.set(0, 0, 0)
camera2.lookAt(lookAtQueen)
scene.add(camera2)
// const helper2 = new THREE.CameraHelper( camera2 )
// scene2.add( helper2 )

const lookAtTarget3 = new THREE.Vector3(0, 0, 5);
const camera3 = camera2.clone()

camera3.lookAt(lookAtTarget3)
scene.add(camera3);

const lookAtTarget4 = new THREE.Vector3(5, 0, 0);
const camera4 = camera2.clone()

camera4.lookAt(lookAtTarget4)
scene.add(camera4);


const lookAtTarget5 = new THREE.Vector3(-5, 0, 0);
const camera5 = camera2.clone()

camera5.lookAt(lookAtTarget5)
scene.add(camera5);


gui.add(camera.position, 'x').min(-3).max(6).step(0.1).name('Camera X')
// gui.add(camera.position, 'y').min(-3).max(6).step(0.1).name('Position Y')
gui.add(camera.position, 'z').min(-3).max(6).step(0.1).name('camera Z')

gui.add(camera, 'fov', 10, 75).name('Camera FOV').onChange(() => {
  camera.updateProjectionMatrix();
})

// const geometry2 = new THREE.BoxGeometry();
// const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
// const cube = new THREE.Mesh(geometry2, material);
// scene2.add(cube)


function constrainCamera() {
  const cameraPosition = camera.position.clone()
  const distanceFromCenter = cameraPosition.distanceTo(sphereCenter)

  if (distanceFromCenter > sphereRadius) {
    // Restrict the camera to the surface of the sphere
    const direction = cameraPosition.sub(sphereCenter).normalize();
    camera.position.copy(sphereCenter.clone().add(direction.multiplyScalar(sphereRadius)));
  }
}


gui.add(meshGroup, 'visible').name('Show Chess Pieces')

// Active Scene and Camera
// let activeScene = scene
let activeCamera = camera
// let activeControls = orbitControls



// ----------------------------------------------------------------------------------

// PHYSICS

// const world = new CANNON.World()
// world.gravity.set(0, -9.82, 0); // Gravity in the y-axis




// ----------------------------------------------------------------------------------
// RENDERER
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

window.addEventListener('dblclick', () => {
  if(!document.fullscreenElement) {
      canvas.requestFullscreen()
  }
  else{
      document.exitFullscreen()
  }
})
// ----------------------------------------------------------------------------------
// Controls
const orbitControls = new OrbitControls(camera, canvas)
orbitControls.enableDamping = true
orbitControls.dampingFactor = 0.25
orbitControls.maxPolarAngle = Math.PI / 2


// const raycaster = new THREE.Raycaster();
// const pointer = new THREE.Vector2();
// let selectedObject = null;
// let intersectionPoint = new THREE.Vector3();

// canvas.addEventListener('mousedown', (event) => {
//   pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
//   pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

//   // Cast a ray to detect intersected objects
//   raycaster.setFromCamera(pointer, activeCamera);
//   const intersects = raycaster.intersectObjects(
//     Object.values(loadedDisplayModels).flatMap(model => model.children),
//     true
//   );

//   if (intersects.length > 0) {
//     selectedObject = intersects[0].object;
//     intersectionPoint.copy(intersects[0].point);

//     // Adjust pivot by translating geometry
//     const pivotOffset = new THREE.Vector3().copy(intersectionPoint).sub(selectedObject.position);
//     selectedObject.geometry.translate(-pivotOffset.x, -pivotOffset.y, -pivotOffset.z);

//     // Update the position to match the intersection point
//     selectedObject.position.add(pivotOffset);
//   }
// });

// canvas.addEventListener('mousemove', (event) => {
//   if (!selectedObject) return;

//   // Rotate object around its dynamically updated pivot
//   const deltaX = event.movementX * 0.01; // Adjust sensitivity
//   const deltaY = event.movementY * 0.01;

//   selectedObject.rotation.x += deltaY; // Rotate around X-axis
//   selectedObject.rotation.z += deltaX; // Rotate around Z-axis
// });

// canvas.addEventListener('mouseup', () => {
//   selectedObject = null; // Deselect the object on mouse up
// });
// scene.add(controls)

// ----------------------------------------------------------------------------------

const cellSize = 1 // Size of each grid cell for the chessboard
const halfCell = cellSize / 2
const gridHalfSize = 4
const chessControls = new DragControls(meshGroup.children, camera, renderer.domElement)
let initialZ = 0
// chessControls.recursive = false
const chessControlsEnabled = {
  enable: true
}

gui.add(chessControlsEnabled, 'enable').name('Enable Dragging').onChange(enabled => {
  chessControls.enabled = enabled;
})


chessControls.addEventListener('dragstart', (event) => {

  orbitControls.enabled = false

  // console.log('Drag started', event)

})


chessControls.addEventListener('drag', (event) => {
  const selected = event.object

  // Snap to grid logic
  selected.position.x = selected.position.x  * cellSize
  selected.position.z = Math.round(selected.position.z / cellSize) * cellSize
  // selected.position.y = Math.round(selected.position.z / cellSize) * cellSize

  // selected.position.y = cellSize/2

  // Keep object within bounds of the grid
  // const minBoundary = -gridHalfSize + halfCell;
  // const maxBoundary = gridHalfSize - halfCell;

  // if (selected.position.x < minBoundary) selected.position.x = minBoundary;
  // if (selected.position.x > maxBoundary) selected.position.x = maxBoundary;
  // if (selected.position.z < minBoundary) selected.position.z = minBoundary;
  // if (selected.position.z > maxBoundary) selected.position.z = maxBoundary;

  // Ensure Y-axis remains constant (e.g., for the chessboard plane)
  selected.position.z= 0.5 //
  // selected.position.x= 0.5 //
})

chessControls.addEventListener('dragend', (event) => {
  orbitControls.enabled = true

  // console.log('Drag ended', event)
})

chessControls.addEventListener('hoveron', (event) => {

})

chessControls.addEventListener('hoveroff', (event) => {

})




const gridHelper = new THREE.GridHelper( 8, 8, 0xffffff, 0xffffff)
gridHelper.position.set(0,0,0)
   scene.add(gridHelper)





// ----------------------------------------------------------------------------------

// POST PROCESSING

const effectComposer = new EffectComposer(renderer)
effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
effectComposer.setSize(sizes.width, sizes.height)

const renderPass = new RenderPass(scene, camera)
effectComposer.addPass(renderPass)

const dotScreenPass = new DotScreenPass()
effectComposer.addPass(dotScreenPass)
const bloomPass = new UnrealBloomPass()
effectComposer.addPass(bloomPass)

dotScreenPass.enabled = false
bloomPass.enabled = true
bloomPass.strength = 0.15

const guiSettings = {
  'Dot Screen Effect': false,
  'Bloom Effect': true,
  'Bloom Intensity': 0.2
}
gui.add(guiSettings, 'Dot Screen Effect').onChange((value) => {
  dotScreenPass.enabled = value
})

gui.add(guiSettings, 'Bloom Effect').onChange((value) => {
  bloomPass.enabled = value
})
gui.add(guiSettings, 'Bloom Intensity', 0, 0.5).onChange((value) => {
    bloomPass.strength = value; // Adjust bloom strength
})


// ----------------------------------------------------------------------------------

// Active Scene and Camera

let activeControls = orbitControls


// Scene Switching
const cameraSceneMap = {
  '1': { camera: camera, scene: scene, controlsEnabled: true },
  '2': { camera: camera2, scene: scene2, controlsEnabled: false },
  '3': { camera: camera3, scene: scene2, controlsEnabled: false },
  '4': { camera: camera4, scene: scene2, controlsEnabled: false },
  '5': { camera: camera5, scene: scene2, controlsEnabled: false },
};

// Event listener for keydown
window.addEventListener('keydown', (event) => {
  const config = cameraSceneMap[event.key];

  if (config) {
    activeCamera = config.camera;
    activeScene = config.scene;
    orbitControls.enabled = config.controlsEnabled; // Enable or disable controls dynamically
    console.log(`Switching to Camera ${event.key}`);
    updateGUIVisibility();
  }
});



function updateGUIVisibility() {
  if (activeScene === scene2) {
    gui.hide()
  } else {
    gui.show()
  }
}
// ----------------------------------------------------------------------------------
// ANIMATE
const clock = new THREE.Clock()

const tick = () =>
{

    // Update controls
    if (activeControls) {
        activeControls.update(); // Only  the active controls
    }

    if (activeScene === scene) {
        if (camera.position.y < 0) {
            camera.position.y = 0 // Prevent going below y = 0
        }
        chessControls.update()
        constrainCamera()
        // renderer.render(scene, camera)
        effectComposer.render()


      } else if (activeScene === scene2) {
        // Render Scene 2 normally
        renderer.render(scene2, activeCamera)
    }




    // Render




    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()

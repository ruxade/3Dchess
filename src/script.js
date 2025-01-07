import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import gsap from 'gsap'
import * as dat from 'dat.gui'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'


// -----------------------------------------

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// AXIS HELPER
const axesHelper = new THREE.AxesHelper(3)
scene.add(axesHelper)

// DEBUG
const gui = new dat.GUI({
  // closed: true,
  width: 400
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
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()

  // Update renderer
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})




// LIGHTS
const light = new THREE.AmbientLight(0xffffff, 0.5) // Color, intensity
scene.add(light)

const pointLight = new THREE.PointLight(0xffffff, 10, 100); // Color, intensity, distance
pointLight.position.set(5, 5, 5)
scene.add(pointLight)

const pointLightHelper = new THREE.PointLightHelper(pointLight, 1) // POINT LIGHT HELPER
// scene.add(pointLightHelper);

// BASE


// const parameters = {
//     color: 0xff0000,
//     spin: () =>
//     {
//         gsap.to(mesh.rotation, 1, { y: mesh.rotation.y + Math.PI * 2 })
//     }
// }
/**
 * Object
 */
// const geometry = new THREE.BoxBufferGeometry(1, 1, 1)
// const material = new THREE.MeshBasicMaterial({ color: 0xff0000 })
// const mesh = new THREE.Mesh(geometry, material)
// scene.add(mesh)

// cube
// const geometry = new THREE.BoxGeometry(1, 1, 1)
// const material = new THREE.MeshBasicMaterial({ color: '#ff0000'})
// const mesh = new THREE.Mesh(geometry, material)
// scene.add(mesh)
// -----------------------------------------
// MODELS
// GLTF LOADER
// const gltfLoader = new GLTFLoader()
// console.log(gltfLoader)

// gltfLoader.load(
//   '/models/set/glTF/rook.glb',
//   // (gltf) => {
//   //   console.log('Model loaded successfully!')
//   //   console.log(gltf)
//   // },
//   // (xhr) => {
//   //   console.log(`Loading progress: ${xhr.loaded }`)
//   // },
//   // (error) => {
//   //   console.error('Error loading model:', error)
//   // },
//   (gltf) => {
//     scene.add(gltf.scene[0])
//   }
// )


  // const loadAndPositionModel = (modelPath, scale, position, material) => {
  //   fbxLoader.load(
  //     modelPath,
  //     (object) => {
  //       console.log(`${modelPath} loaded successfully!`);

  //       // Set the scale
  //       object.scale.set(scale, scale, scale)

  //       // Traverse and apply material
  //       object.traverse((child) => {
  //         if (child.isMesh) {
  //           // child.geometry.computeVertexNormals()
  //           child.material = material
  //         }
  //       })

  //       // Set the position
  //       object.position.set(position.x, position.y, position.z)

  //       // Add the object to the scene
  //       scene.add(object)
  //     },
  //     (xhr) => {
  //       console.log(`Loading progress: ${(xhr.loaded / xhr.total) * 100}%`)
  //     },
  //     (error) => {
  //       console.error(error)
  //     }
  //   )
  // }




// TEXTURES and MATERIALS
const textureLoader = new THREE.TextureLoader()

const darkTexture = textureLoader.load('/textures/matcaps/23.png')
const lightTexture = textureLoader.load('/textures/matcaps/16.png')
const boardTexture = textureLoader.load('/textures/checkerboard-8x8.png')

const backgroundTexture = textureLoader.load('/textures/matcaps/6.png')

boardTexture.repeat.x = 8
boardTexture.repeat.y = 8
boardTexture.wrapS = THREE.MirroredRepeatWrapping
boardTexture.wrapT = THREE.MirroredRepeatWrapping
boardTexture.offset.set(0.5, 0.5)
darkTexture.magFilter  =THREE.NearestFilter
boardTexture.magFilter  =THREE.NearestFilter


const textureMaterial = new THREE.MeshMatcapMaterial({ matcap: backgroundTexture})

const darkMaterial = new THREE.MeshMatcapMaterial({
  matcap: darkTexture,
  // side: THREE.FrontSide,  // Set the side to render (optional, based on your preference)
  flatShading: false       // Optional: enables flat shading for a more stylized look
})

const lightMaterial = new THREE.MeshMatcapMaterial({
  matcap: lightTexture,
  // side: THREE.FrontSide,
  flatShading: false
})

const boardMaterial = new THREE.MeshBasicMaterial({map : boardTexture})

const backgroundGeometry = new THREE.SphereGeometry(50, 64, 64); // A large sphere
const backgroundMesh = new THREE.Mesh(backgroundGeometry, textureMaterial)
backgroundGeometry.scale(-1, 1, 1)
backgroundMesh.position.set(0, 0, 0)
scene.add(backgroundMesh)

// FLOOR

const floorGeometry = new THREE.PlaneGeometry(8, 8)
const floorMaterial = new THREE.MeshStandardMaterial({
  color: '#ffffff',
  roughness: 0.8,
  metalness: 0.2
})
const floor = new THREE.Mesh(floorGeometry, boardMaterial)
floor.rotation.x = - Math.PI / 2
// floor.position.set(4,0,4)
// scene.add(floor)


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


// LOADER FBX

const fbxLoader = new FBXLoader()



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

// meshGroup.add(loadedModels)
// scene.add(meshGroup)


// BOUNDING BOX- fail
// const combinedBoundingBox = () => {
//   const box = new THREE.Box3()  //  box to encompass all objects
//   const group = new THREE.Group()

//   scene.traverse((object) => {
//     if (object.isMesh) {  // ignoring lights, cameras
//       object.geometry.computeBoundingBox()

//       box.expandByObject(object)
//       group.add(object)

//     }
//   })

//   return box

// }

// //  visualize the combined bounding box
// const box = combinedBoundingBox()
// console.log('Combined Bounding Box:', box)

// const center = new THREE.Vector3()
// box.getCenter(center)
// console.log('Bounding Box Center:', center)

// // scene.traverse((object) => {
// //   if (object.isMesh) {
// //     group.add(object)  // Add each object to the group
// //   }
// // })


// MESH GROUP



// scene.add(meshGroup)

// meshGroup.position.set(0, 0, 0)





// CAMERA
// Base camera
const aspectRatio = sizes.width / sizes.height
const camera = new THREE.PerspectiveCamera(55, aspectRatio, 0.1, 100) // fov , aspect, near, far
// ortho CAMERA
// const camera = new THREE.OrthographicCamera(-1 * aspectRatio, 1 * aspectRatio, 1, -1, 0.1, 100)
camera.position.x = 9
camera.position.y = 5
camera.position.z = 9
// camera.lookAt(4, 4, 5)
camera.lookAt(floor.position.x + 5)
scene.add(camera)
const helper = new THREE.CameraHelper( camera )
// scene.add( helper )

gui.add(camera.position, 'x').min(-3).max(6).step(0.1).name('Position X')
gui.add(camera.position, 'y').min(-3).max(6).step(0.1).name('Position Y')
gui.add(camera.position, 'z').min(-3).max(6).step(0.1).name('Position Z')

// gui.hide()
// gui.add(mesh.position, 'y').min(- 3).max(3).step(0.01).name('elevation')
// gui.add(mesh, 'visible')
// gui.add(material, 'wireframe')

// gui
//     .addColor(parameters, 'color')
//     .onChange(() =>
//     {
//         material.color.set(parameters.color)
//     })

// gui.add(parameters, 'spin')


// -----------------------------------------
// Move Obj
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()
const sceneObjects = []
let selectedObject = null
let dragOffset = new THREE.Vector3()


//  event listeners for mouse actions
window.addEventListener('mousedown', onMouseDown, false)
window.addEventListener('mousemove', onMouseMove, false)
window.addEventListener('mouseup', onMouseUp, false)

function onMouseMove(event) {
  mouse.x = (event.clientX / sizes.width) * 2 - 1
  mouse.y = -(event.clientY / sizes.height) * 2 + 1

  // If dragging, update the position of the selected object
  if (selectedObject) {
      raycaster.setFromCamera(mouse, camera)
      const planeIntersect = raycaster.intersectObject(floor)[0]
      if (planeIntersect) {
          selectedObject.position.x = planeIntersect.point.x + dragOffset.x
          selectedObject.position.z = planeIntersect.point.z + dragOffset.z
      }
  }
}

function onMouseDown(event) {
  // Perform raycasting to detect object under mouse
  raycaster.setFromCamera(mouse, camera)
  const intersects = raycaster.intersectObjects(scene.children, true)

  if (intersects.length > 0) {
      const intersectedObject = intersects[0].object

      // Check if the clicked object is a chess piece
      if (intersectedObject.parent && intersectedObject.parent.isGroup) {
          selectedObject = intersectedObject.parent

          // Calculate offset to keep piece aligned while dragging
          raycaster.setFromCamera(mouse, camera)
          const planeIntersect = raycaster.intersectObject(floor)[0];
          if (planeIntersect) {
              dragOffset.set(
                  selectedObject.position.x - planeIntersect.point.x,
                  0,
                  selectedObject.position.z - planeIntersect.point.z
              )
          }
      }
  }
}

function onMouseUp(event) {
  // Release the selected object
  if (selectedObject) {
      // Snap the piece to the closest square
      selectedObject.position.x = Math.round(selectedObject.position.x)
      selectedObject.position.z = Math.round(selectedObject.position.z)

      selectedObject = null // Deselect
  }
}



// function onMouseClick(event) {
//   // Convert mouse click position to normalized device coordinates (-1 to +1) for raycasting
//   mouse.x = (event.clientX / window.innerWidth) * 2 - 1
//   mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
// }




// -----------------------------------------
// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.dampingFactor = 0.25
controls.maxPolarAngle = Math.PI / 2

// controls.attach(object)
// scene.add(controls)

// -----------------------------------------
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

// -----------------------------------------
// ANIMATE
const clock = new THREE.Clock()

const tick = () =>
{

    // Update controls
    controls.update()

    if (camera.position.y < 0) {
      camera.position.y = 0; // Prevent going below y = 0
  }

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()

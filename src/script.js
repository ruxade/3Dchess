import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import gsap from 'gsap'
import * as dat from 'dat.gui'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { fog } from 'three/src/nodes/TSL.js'
import  CANNON  from "cannon"
import { DragControls } from 'three/examples/jsm/controls/DragControls.js'

// -----------------------------------------

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// AXIS HELPER
// const axesHelper = new THREE.AxesHelper(3)
// scene.add(axesHelper)

// DEBUG
const gui = new dat.GUI({
  // closed: true,
  // width: 400
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
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()

  // Update renderer
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})


// ----------------------------------------------------------------------------------

// FOG
// const fog  = new THREE.Fog( '00ffff', 15, 25) //color, near, far
// scene.fog = fog
const fogSettings = {
  color: 0xcac0e5,
  density: 0.03 // Initial density value
}
const fog1 = new THREE.FogExp2( fogSettings.color, fogSettings.density )
scene.fog = fog1


// gui.add(fogSettings.density, 0, 1, 0.01).onChange((value) => {
//   fog.density = value // Update the fog density dynamically
// })
gui
    .add(fogSettings, 'density', 0, 0.15, 0.01)
    .onChange( (value) => {
      fog1.density = value
    })
gui
    .addColor(fogSettings, 'color')
    .onChange( () => {
      fog1.color.set(fogSettings.color)
    })


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


// ----------------------------------------------------------------------------------

// TEXTURES and MATERIALS
const textureLoader = new THREE.TextureLoader()

// LIGHT and DARK
const darkTexture = textureLoader.load('/textures/matcaps/32.png')
const lightTexture = textureLoader.load('/textures/matcaps/17.png')
const boardTexture = textureLoader.load('/textures/checkerboard-8x8.png')
boardTexture.repeat.x = 8
boardTexture.repeat.y = 8
boardTexture.wrapS = THREE.MirroredRepeatWrapping
boardTexture.wrapT = THREE.MirroredRepeatWrapping
boardTexture.offset.set(0.5, 0.5)
boardTexture.magFilter  =THREE.NearestFilter

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

const backgroundGeometry = new THREE.SphereGeometry(sphereRadius, 64, 32); // A large sphere
const backgroundMesh = new THREE.Mesh(backgroundGeometry, backgroundMaterial)
backgroundGeometry.scale(-1, 1, 1)
backgroundMesh.position.set(0, 0, 0)

scene.add(backgroundMesh)

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
  roughness: 0.8,
  metalness: 0.9
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

    // Create the physics body for the piece
    const piecePhysicsBody = createPiecePhysics(modelClone, position)

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



console.log( meshGroup)
// console.log(loadedModels)
// console.log(Object.keys(loadedModels).length)

// BOUNDING BOX- ?

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
const camera = new THREE.PerspectiveCamera(45, aspectRatio, 0.1, 100) // fov , aspect, near, far
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

gui.add(camera.position, 'x').min(-3).max(6).step(0.1).name('Camera X')
// gui.add(camera.position, 'y').min(-3).max(6).step(0.1).name('Position Y')
gui.add(camera.position, 'z').min(-3).max(6).step(0.1).name('camera Z')



function constrainCamera() {
  const cameraPosition = camera.position.clone()
  const distanceFromCenter = cameraPosition.distanceTo(sphereCenter)

  if (distanceFromCenter > sphereRadius) {
    // Restrict the camera to the surface of the sphere
    const direction = cameraPosition.sub(sphereCenter).normalize();
    camera.position.copy(sphereCenter.clone().add(direction.multiplyScalar(sphereRadius)));
  }
}




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

// SS----------------------------------------------------------------------------------
// Move Obj

// const raycaster = new THREE.Raycaster()
// const mouse = new THREE.Vector2()
// const sceneObjects = []
// let selectedObject = null
// let dragOffset = new THREE.Vector3()


// //  event listeners for mouse actions
// window.addEventListener('mousedown', onMouseDown, false)
// window.addEventListener('mousemove', onMouseMove, false)
// window.addEventListener('mouseup', onMouseUp, false)

// function onMouseMove(event) {
//   mouse.x = (event.clientX / sizes.width) * 2 - 1
//   mouse.y = -(event.clientY / sizes.height) * 2 + 1

//   // If dragging, update the position of the selected object
//   if (selectedObject) {
//       raycaster.setFromCamera(mouse, camera)
//       const planeIntersect = raycaster.intersectObject(floor)[0]
//       if (planeIntersect) {
//           selectedObject.position.x = planeIntersect.point.x + dragOffset.x
//           selectedObject.position.z = planeIntersect.point.z + dragOffset.z
//       }
//   }
// }

// function onMouseDown(event) {
//   // Perform raycasting to detect object under mouse
//   raycaster.setFromCamera(mouse, camera)
//   const intersects = raycaster.intersectObjects(scene.children, true)

//   if (intersects.length > 0) {
//       const intersectedObject = intersects[0].object

//       // Check if the clicked object is a chess piece
//       if (intersectedObject.parent && intersectedObject.parent.isGroup) {
//           selectedObject = intersectedObject.parent

//           // Calculate offset to keep piece aligned while dragging
//           raycaster.setFromCamera(mouse, camera)
//           const planeIntersect = raycaster.intersectObject(floor)[0];
//           if (planeIntersect) {
//               dragOffset.set(
//                   selectedObject.position.x - planeIntersect.point.x,
//                   0,
//                   selectedObject.position.z - planeIntersect.point.z
//               )
//           }
//       }
//   }
// }

// function onMouseUp(event) {
//   // Release the selected object
//   if (selectedObject) {
//       // Snap the piece to the closest square
//       selectedObject.position.x = Math.round(selectedObject.position.x)
//       selectedObject.position.z = Math.round(selectedObject.position.z)

//       selectedObject = null // Deselect
//   }
// }



// function onMouseClick(event) {
//   // Convert mouse click position to normalized device coordinates (-1 to +1) for raycasting
//   mouse.x = (event.clientX / window.innerWidth) * 2 - 1
//   mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
// }


// ----------------------------------------------------------------------------------

// PHYSICS

const world = new CANNON.World()
world.gravity.set(0, -9.82, 0); // Gravity in the y-axis

const pieceMaterial = new CANNON.Material("pieceMaterial")
const createPiecePhysics = (model, position) => {
  const shape = new CANNON.Sphere(0.5)
  const body = new CANNON.Body({
    mass: 1, // Mass of the piece
    position: new CANNON.Vec3(position.x, position.y, position.z),  // Position from the model
    material: pieceMaterial
  })
  body.addShape(shape)
  world.addBody(body)

  return body
};


// ----------------------------------------------------------------------------------
// Controls
const orbitControls = new OrbitControls(camera, canvas)
orbitControls.enableDamping = true
orbitControls.dampingFactor = 0.25
orbitControls.maxPolarAngle = Math.PI / 2

// controls.attach(object)
// scene.add(controls)

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

// const cellSize = 1 // Size of each grid cell for the chessboard
// const halfCell = cellSize / 2
// const gridHalfSize = 4
// const chessControls = new DragControls(meshGroup.children, camera, renderer.domElement)
// let initialZ = 0
// chessControls.recursive = false



// chessControls.addEventListener('dragstart', (event) => {

//   orbitControls.enabled = false

//   console.log('Drag started', event)

// })


// chessControls.addEventListener('drag', (event) => {
//   const selected = event.object

//   // Snap to grid logic
//   // selected.position.x = selected.position.x  * cellSize
//   // selected.position.z = Math.round(selected.position.z / cellSize) * cellSize
//   // selected.position.y = Math.round(selected.position.z / cellSize) * cellSize

//   // selected.position.y = cellSize/2

//   // Keep object within bounds of the grid
//   // const minBoundary = -gridHalfSize + halfCell;
//   // const maxBoundary = gridHalfSize - halfCell;

//   // if (selected.position.x < minBoundary) selected.position.x = minBoundary;
//   // if (selected.position.x > maxBoundary) selected.position.x = maxBoundary;
//   // if (selected.position.z < minBoundary) selected.position.z = minBoundary;
//   // if (selected.position.z > maxBoundary) selected.position.z = maxBoundary;

//   // Ensure Y-axis remains constant (e.g., for the chessboard plane)
//   selected.position.z= 0.5 //
//   // selected.position.x= 0.5 //
// })

// chessControls.addEventListener('dragend', (event) => {
//   orbitControls.enabled = true

//   console.log('Drag ended', event)
// })

// chessControls.addEventListener('hoveron', (event) => {

// })

// chessControls.addEventListener('hoveroff', (event) => {

// })




const gridHelper = new THREE.GridHelper( 8, 8, 0x000000, 0xffffff)
gridHelper.position.set(0,0,0)
   scene.add(gridHelper)





// ----------------------------------------------------------------------------------
// ANIMATE
const clock = new THREE.Clock()

const tick = () =>
  {

  // Update controls
  orbitControls.update()
  // chessControls.update()
  if (camera.position.y < 0) {
    camera.position.y = 0; // Prevent going below y = 0
  }

  constrainCamera()

    world.step(1 / 60)

    meshGroup.children.forEach((child, index) => {
      const body = world.bodies[index]; // Assuming the bodies and meshes are in sync by order
      if (body) {
        child.position.copy(body.position)
        child.rotation.copy(body.rotation)
      }
    })
    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()

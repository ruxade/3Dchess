import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import gsap from 'gsap'
import * as dat from 'dat.gui'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'

console.log('hello 3Dchess')
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

// FLOOR

const floorGeometry = new THREE.PlaneGeometry(10, 10)
const floorMaterial = new THREE.MeshStandardMaterial({
  color: '#ffffff',
  roughness: 0.8,
  metalness: 0.2
})
const floor = new THREE.Mesh(floorGeometry, floorMaterial)
floor.rotation.x = - Math.PI / 2
scene.add(floor)
// )


// LIGHTS
const light = new THREE.AmbientLight(0xffffff, 0.5) // Color, intensity
scene.add(light)

const pointLight = new THREE.PointLight(0xffffff, 10, 100); // Color, intensity, distance
pointLight.position.set(5, 5, 5)
scene.add(pointLight)

const pointLightHelper = new THREE.PointLightHelper(pointLight, 1) // POINT LIGHT HELPER
scene.add(pointLightHelper);

// BASE


// TEXTURES
const textureLoader = new THREE.TextureLoader()

const darkTexture = textureLoader.load('/textures/matcaps/11.png')
const lightTexture = textureLoader.load('/textures/matcaps/14.png')

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


const fbxLoader = new FBXLoader()
// const loadModelsSequentially = () => {
// fbxLoader.load(
//   '/models/set/fbx/pawn.fbx', // Path to the FBX model
//   (pawn) => {
//     console.log('FBX Model loaded successfully!')
//     pawn.scale.set(0.01, 0.01, 0.01)

//     pawn.traverse((child) => {
//       if (child.isMesh) {
//         child.geometry.computeVertexNormals()
//         child.material = darkMaterial
//       }
//     })

//     scene.add(pawn) // Add the loaded object to the scene
//   },
//   (xhr) => {
//     console.log(`Loading progress: ${(xhr.loaded / xhr.total) * 100}%`);
//   },
//   (error) => {
//     console.error('Error loading FBX model:', error);
//   }
// )


const loadAndPositionModel = (modelPath, scale, position, material) => {
  fbxLoader.load(
    modelPath,
    (object) => {
      console.log(`${modelPath} loaded successfully!`);

      // Set the scale
      object.scale.set(scale, scale, scale)

      // Traverse and apply material
      object.traverse((child) => {
        if (child.isMesh) {
          // child.geometry.computeVertexNormals()
          child.material = material
        }
      });

      // Set the position
      object.position.set(position.x, position.y, position.z)

      // Add the object to the scene
      scene.add(object)
    },
    (xhr) => {
      console.log(`Loading progress: ${(xhr.loaded / xhr.total) * 100}%`)
    },
    (error) => {
      console.error('Error loading FBX model:', error)
    }
  );
};

// Load each piece and position them
const scale = 0.01
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

// Paths to the models
const modelPaths = {
  pawn: '/models/set/fbx/pawn.fbx',
  bishop: '/models/set/fbx/bishop.fbx',
  knight: '/models/set/fbx/knight.fbx',
  rook: '/models/set/fbx/rook.fbx',
  king: '/models/set/fbx/king.fbx',
  queen: '/models/set/fbx/queen.fbx'
};

// Load each piece at its respective position

positions.forEach(({ model, position }) => {
  loadAndPositionModel(modelPaths[model], scale, position, darkMaterial);
})
// Load all models once
// Object.keys(modelPaths).forEach((modelName) => {
//   loadAndStoreModel(modelPaths[modelName], modelName);
// })

// clone
// const loadMirroredModels = () => {
//   const mirrorPositions = positions.map(({ model, position }) => ({
//     model,
//     position: { x: 7 - position.x, y: position.y, z: position.z }
//   }))

//   // Loop through the mirrored positions and clone the models
//   mirrorPositions.forEach(({ model, position }) => {
//     const modelClone = loadedModels[model].clone() // Clone the already loaded model
//     modelClone.material = lightMaterial // Apply new material
//     modelClone.position.set(position.x, position.y, position.z) // Set mirrored position
//     scene.add(modelClone);// Add cloned object to the scene
//   });
// };


// loadMirroredModels()














// CAMERA
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 1
camera.position.y = 1
camera.position.z = 3
// ortho CAMERA
// const aspectRatio = sizes.width / sizes.height
// const camera = new THREE.OrthographicCamera(-1 * aspectRatio, 1 * aspectRatio, 1, -1, 0.1, 100)

scene.add(camera)
// camera.lookAt(mesh.position)


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
// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

// -----------------------------------------
// RENDERER
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// -----------------------------------------
// ANIMATE
const clock = new THREE.Clock()

const tick = () =>
{

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()

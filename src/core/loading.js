// Loading feedback: a progress bar in the DOM plus a black shader overlay that
// fades out once every texture and model has arrived.
//
// THREE.LoadingManager counts every asset started through loaders that were
// given this manager, and calls us back with progress and completion.

import * as THREE from 'three'
import { gsap } from 'gsap'
import { LOADING } from '../config.js'

export function createLoading(scene) {
  const barElement = document.querySelector('.loading-bar')
  const textElement = document.querySelector('.loading-text')
  const overlay = createOverlay()
  scene.add(overlay)

  const onProgress = (_url, loaded, total) => {
    barElement.style.transform = `scaleX(${loaded / total})`
  }

  const onLoaded = () => {
    gsap.delayedCall(LOADING.fadeDelay, () => {
      gsap.to(overlay.material.uniforms.uAlpha, {
        duration: LOADING.fadeDuration,
        value: 0,
        onComplete: () => {
          scene.remove(overlay)   // nothing left to see, stop drawing it
          overlay.geometry.dispose()
          overlay.material.dispose()
        }
      })
      barElement.classList.add('ended')
      barElement.style.transform = ''
      textElement.classList.add('ended')
      document.body.classList.add('ready')
    })
  }

  const manager = new THREE.LoadingManager(onLoaded, onProgress)
  return { manager, overlay }
}

// A 2x2 plane drawn straight in clip space (gl_Position = position) covers
// the whole screen no matter where the camera is. uAlpha is the only knob.
function createOverlay() {
  const geometry = new THREE.PlaneGeometry(2, 2, 1, 1)
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthTest: false,
    uniforms: { uAlpha: { value: 1 } },
    vertexShader: /* glsl */ `
      void main() {
        gl_Position = vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform float uAlpha;
      void main() {
        gl_FragColor = vec4(0.0, 0.0, 0.0, uAlpha);
      }`
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.name = 'loading-overlay'
  mesh.frustumCulled = false   // the plane ignores the camera, so culling must too
  mesh.renderOrder = 999       // draw last, on top of everything
  return mesh
}

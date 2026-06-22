import * as THREE from 'three'

// Inline OBJ parser. Replaces three/examples/jsm/loaders/OBJLoader because
// that file has top-level `new Vector3()` calls — bundling it crashed any
// page that doesn't load the Three.js CDN script (i.e. every page except home).
function parseOBJ(text) {
  const verts = []
  const norms = []
  const tex = []
  const finalPos = []
  const finalNorm = []
  const finalUV = []

  const lines = text.split('\n')
  for (const raw of lines) {
    const line = raw.trim()
    if (!line || line[0] === '#') continue
    const parts = line.split(/\s+/)
    const type = parts[0]
    if (type === 'v') {
      verts.push(+parts[1], +parts[2], +parts[3])
    } else if (type === 'vn') {
      norms.push(+parts[1], +parts[2], +parts[3])
    } else if (type === 'vt') {
      tex.push(+parts[1], +parts[2])
    } else if (type === 'f') {
      const refs = parts.slice(1).map((p) => p.split('/'))
      for (let i = 1; i < refs.length - 1; i++) {
        for (const r of [refs[0], refs[i], refs[i + 1]]) {
          const vi = (+r[0] - 1) * 3
          finalPos.push(verts[vi], verts[vi + 1], verts[vi + 2])
          if (r[1]) {
            const ti = (+r[1] - 1) * 2
            finalUV.push(tex[ti] || 0, tex[ti + 1] || 0)
          }
          if (r[2]) {
            const ni = (+r[2] - 1) * 3
            finalNorm.push(norms[ni], norms[ni + 1], norms[ni + 2])
          }
        }
      }
    }
  }

  const geom = new THREE.BufferGeometry()
  geom.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(finalPos, 3)
  )
  if (finalNorm.length) {
    geom.setAttribute(
      'normal',
      new THREE.Float32BufferAttribute(finalNorm, 3)
    )
  } else {
    geom.computeVertexNormals()
  }
  if (finalUV.length) {
    geom.setAttribute('uv', new THREE.Float32BufferAttribute(finalUV, 2))
  }

  const group = new THREE.Group()
  group.add(new THREE.Mesh(geom, new THREE.MeshStandardMaterial()))
  return group
}

const IDLE_SPEED = 0.35
const VELOCITY_FACTOR = 0.008
const MAX_BOOST_SPEED = 6.0
const SMOOTHING = 0.08

const CHROME_ENV_URL =
  'https://cdn.prod.website-files.com/69e0fdfc6da92a5c220bbe58/6a16e66acb7f9db773de862f_chrome.jpg'

const METALNESS = 1.0
const ROUGHNESS = 0.15
const ENV_MAP_INTENSITY = 1.0

// Static tilt applied to the loaded model BEFORE the Y spin.
// The OBJ ships lying flat (face on the XZ plane), so we stand it up here.
// Flip the sign of MODEL_TILT_X if the C's opening faces the wrong way.
const MODEL_TILT_X = -Math.PI / 2
const MODEL_TILT_Y = 0
const MODEL_TILT_Z = 0

const MAX_PIXEL_RATIO = 2
const MAX_DELTA = 1 / 30

function resolveAssetBase() {
  const scripts = Array.from(document.scripts)
  const found = scripts.find((s) =>
    /\/(src\/)?main\.js(\?|$)/.test(s.src || '')
  )
  if (found?.src) {
    return `${new URL(found.src).origin}/chrome-c`
  }
  return '/chrome-c'
}

export function initChromeC(container = document) {
  const root = container?.querySelector
    ? container
    : document
  const host = root.querySelector('[data-chrome-c-init]')
  if (!host) return null

  if (typeof window.THREE === 'undefined') {
    console.warn(
      '[chromeC] window.THREE not found — Three.js CDN script is missing from Webflow head'
    )
    return null
  }

  const assetBase = resolveAssetBase()
  const envUrl = host.dataset.chromeCEnv || CHROME_ENV_URL
  const objUrl = host.dataset.chromeCObj || `${assetBase}/Yo.obj`

  const scene = new THREE.Scene()
  const pivot = new THREE.Group()
  scene.add(pivot)
  const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 100)
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.0

  const canvas = renderer.domElement
  canvas.style.display = 'block'
  canvas.style.width = '100%'
  canvas.style.height = '100%'
  host.appendChild(canvas)

  scene.add(new THREE.HemisphereLight(0xffffff, 0x222233, 0.35))

  let mesh = null
  let envMap = null
  let envTexture = null
  const disposables = []

  const pmrem = new THREE.PMREMGenerator(renderer)
  pmrem.compileEquirectangularShader()

  const textureLoader = new THREE.TextureLoader()
  textureLoader.crossOrigin = 'anonymous'
  textureLoader.load(
    envUrl,
    (texture) => {
      envTexture = texture
      texture.mapping = THREE.EquirectangularReflectionMapping
      texture.colorSpace = THREE.SRGBColorSpace
      const target = pmrem.fromEquirectangular(texture)
      envMap = target.texture
      scene.environment = envMap
      pmrem.dispose()
      if (mesh) applyChromeMaterial(mesh, envMap)
    },
    undefined,
    (err) => console.warn('[chromeC] env map load failed', err)
  )

  fetch(objUrl)
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return r.text()
    })
    .then((text) => {
      mesh = parseOBJ(text)
      mesh.rotation.set(MODEL_TILT_X, MODEL_TILT_Y, MODEL_TILT_Z)
      centerAndFrame(mesh, camera)
      applyChromeMaterial(mesh, envMap || null)
      pivot.add(mesh)
    })
    .catch((err) => console.warn('[chromeC] OBJ load failed', err))

  function applyChromeMaterial(root, env) {
    root.traverse((child) => {
      if (!child.isMesh) return
      const material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: METALNESS,
        roughness: ROUGHNESS,
        envMap: env,
        envMapIntensity: ENV_MAP_INTENSITY,
      })
      if (child.material?.dispose) child.material.dispose()
      child.material = material
      disposables.push(child.geometry, material)
    })
  }

  function centerAndFrame(object, cam) {
    const box = new THREE.Box3().setFromObject(object)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)
    object.position.sub(center)

    const maxDim = Math.max(size.x, size.y, size.z)
    const fov = (cam.fov * Math.PI) / 180
    const distance = (maxDim / 2 / Math.tan(fov / 2)) * 1.4
    cam.position.set(0, 0, distance)
    cam.lookAt(0, 0, 0)
    cam.near = distance / 100
    cam.far = distance * 10
    cam.updateProjectionMatrix()
  }

  let width = 0
  let height = 0
  function resize() {
    const rect = host.getBoundingClientRect()
    const w = Math.max(1, Math.floor(rect.width))
    const h = Math.max(1, Math.floor(rect.height))
    if (w === width && h === height) return
    width = w
    height = h
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  resize()

  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(host)

  let currentSpeed = IDLE_SPEED
  let rafId = null
  let lastTime = 0
  let inView = true
  let pageVisible = !document.hidden
  let running = false

  let lenisVelocity = 0
  let lenisAttachedTo = null
  let lenisAttachInterval = null
  function onLenisScroll(e) {
    lenisVelocity = Math.abs(e?.velocity ?? e?.actualVelocity ?? 0)
  }
  function tryAttachLenis() {
    const inst = window.lenis
    if (!inst || typeof inst.on !== 'function') return false
    if (lenisAttachedTo === inst) return true
    if (lenisAttachedTo)
      lenisAttachedTo.off?.('scroll', onLenisScroll)
    inst.on('scroll', onLenisScroll)
    lenisAttachedTo = inst
    return true
  }
  if (!tryAttachLenis()) {
    lenisAttachInterval = setInterval(() => {
      if (tryAttachLenis()) {
        clearInterval(lenisAttachInterval)
        lenisAttachInterval = null
      }
    }, 200)
  }

  function tick(now) {
    rafId = requestAnimationFrame(tick)
    const t = now * 0.001
    const dt = lastTime ? Math.min(t - lastTime, MAX_DELTA) : 0
    lastTime = t

    if (mesh) {
      const targetSpeed =
        IDLE_SPEED + Math.min(lenisVelocity * VELOCITY_FACTOR, MAX_BOOST_SPEED)
      currentSpeed += (targetSpeed - currentSpeed) * SMOOTHING
      pivot.rotation.y += currentSpeed * dt
      lenisVelocity *= 0.92
    }

    renderer.render(scene, camera)
  }

  function start() {
    if (running) return
    if (!inView || !pageVisible) return
    running = true
    lastTime = 0
    rafId = requestAnimationFrame(tick)
  }

  function stop() {
    if (!running) return
    running = false
    if (rafId !== null) cancelAnimationFrame(rafId)
    rafId = null
  }

  const intersectionObserver = new IntersectionObserver(
    (entries) => {
      inView = entries[0]?.isIntersecting ?? false
      if (inView) start()
      else stop()
    },
    { threshold: 0 }
  )
  intersectionObserver.observe(host)

  function onVisibility() {
    pageVisible = !document.hidden
    if (pageVisible) start()
    else stop()
  }
  document.addEventListener('visibilitychange', onVisibility)

  start()

  return function teardown() {
    stop()
    resizeObserver.disconnect()
    intersectionObserver.disconnect()
    document.removeEventListener('visibilitychange', onVisibility)
    if (lenisAttachInterval) clearInterval(lenisAttachInterval)
    lenisAttachedTo?.off?.('scroll', onLenisScroll)
    scene.remove(pivot)
    disposables.forEach((d) => d?.dispose?.())
    envMap?.dispose?.()
    envTexture?.dispose?.()
    renderer.dispose()
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas)
  }
}

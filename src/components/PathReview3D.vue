<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGraphStore } from '@/stores/graphStore'
import { getMaturityConfig, getRelationConfig } from '@/utils/maturityTags'
import { buildPathLayout } from '@/utils/pathLayout3D'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js'

const router = useRouter()
const graphStore = useGraphStore()
const containerRef = ref(null)

const pathData = ref(graphStore.selectedPath)
const selectedNode = ref(null)        // 点击/悬停显示的信息

// 漫游状态
const tourActive = ref(false)
const tourPlaying = ref(false)
const tourIndex = ref(0)
const tourTotal = ref(0)

// ===== Three 资源（setup 作用域）=====
let scene, camera, renderer, labelRenderer, controls
let layout = null
let pathMeshes = []     // 路径节点 mesh
let neighborMeshes = [] // 邻居节点 mesh
let pickables = []      // 可拾取对象（path + neighbor）
let ringMesh = null     // 当前节点光环（billboard）
let raycaster, pointer
let animationId

// 相机 tween
const goalPos = new THREE.Vector3()
const goalTarget = new THREE.Vector3()
let tweening = false

// 交互 / idle
let userInteracting = false
let idleTimer = null
let tourTimer = null
let hovered = null

// 事件句柄（卸载时移除）
let onPointerMove, onClickScene, onCtrlStart, onCtrlEnd

onMounted(() => {
  if (!pathData.value?.path?.length) { router.push('/'); return }
  initScene()
  buildSceneFromLayout()
  fitOverview(true)
  bindInteraction()
  animate()
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  clearTimeout(idleTimer)
  clearTimeout(tourTimer)
  cancelAnimationFrame(animationId)
  if (controls) {
    controls.removeEventListener('start', onCtrlStart)
    controls.removeEventListener('end', onCtrlEnd)
    controls.dispose()
  }
  if (renderer) {
    renderer.domElement.removeEventListener('pointermove', onPointerMove)
    renderer.domElement.removeEventListener('click', onClickScene)
  }
  disposeScene()
  renderer?.dispose()
  labelRenderer?.domElement.remove()
})

/* ---------------- 场景初始化 ---------------- */
function initScene() {
  const el = containerRef.value
  const w = el.clientWidth
  const h = el.clientHeight

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0d1117)

  camera = new THREE.PerspectiveCamera(50, w / h, 0.5, 1000)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(w, h)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  el.appendChild(renderer.domElement)

  labelRenderer = new CSS2DRenderer()
  labelRenderer.setSize(w, h)
  labelRenderer.domElement.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;'
  el.appendChild(labelRenderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.minDistance = 3
  controls.maxDistance = 120
  controls.autoRotate = true        // idle 极慢自转，交互即停（事件控制）
  controls.autoRotateSpeed = 0.5
  controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }

  scene.add(new THREE.AmbientLight(0x556080, 1.6))
  const dir = new THREE.DirectionalLight(0xffffff, 2.2)
  dir.position.set(12, 24, 14)
  scene.add(dir)
  const fill = new THREE.PointLight(0x4080ff, 0.6, 0, 1.5)
  fill.position.set(-10, 6, -10)
  scene.add(fill)

  raycaster = new THREE.Raycaster()
  pointer = new THREE.Vector2()

  addStarfield()
}

function addStarfield() {
  const N = 360
  const arr = new Float32Array(N * 3)
  for (let i = 0; i < N; i++) {
    const r = 60 + Math.random() * 90
    const t = Math.random() * Math.PI * 2
    const p = Math.acos(2 * Math.random() - 1)
    arr[i * 3] = r * Math.sin(p) * Math.cos(t)
    arr[i * 3 + 1] = r * Math.cos(p)
    arr[i * 3 + 2] = r * Math.sin(p) * Math.sin(t)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(arr, 3))
  const m = new THREE.PointsMaterial({ color: 0x5a6a8a, size: 0.5, transparent: true, opacity: 0.7 })
  scene.add(new THREE.Points(g, m))
}

/* ---------------- 由布局构建场景 ---------------- */
function buildSceneFromLayout() {
  layout = buildPathLayout(pathData.value.path, graphStore.nodes, graphStore.edges)
  tourTotal.value = layout.nodes.length

  // 雾随规模自适应
  scene.fog = new THREE.Fog(0x0d1117, layout.bounds.radius * 1.6, layout.bounds.radius * 4.8)

  buildLayers()
  buildNeighborLinks()
  buildTube()
  buildNeighborNodes()
  buildPathNodes()
  buildRing()
  applyHighlight(null)
}

function buildPathNodes() {
  layout.nodes.forEach((n) => {
    const cfg = getMaturityConfig(n.level)
    const radius = n.level === 'L3' ? 0.48 : n.level === 'L2' ? 0.36 : 0.3
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(cfg.nodeColor),
      emissive: new THREE.Color(cfg.nodeColor),
      emissiveIntensity: 0.5,
      metalness: 0.3, roughness: 0.35,
    })
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 24, 24), mat)
    mesh.position.set(n.pos.x, n.pos.y, n.pos.z)
    mesh.userData = { ...n, kind: 'path', baseRadius: radius }
    scene.add(mesh)
    pathMeshes.push(mesh)
    pickables.push(mesh)

    const div = document.createElement('div')
    div.className = 'node-label path-label'
    div.innerHTML = `<span class="label-name">${n.name}</span><span class="label-lvl" style="color:${cfg.color}">${n.level}</span>`
    const label = new CSS2DObject(div)
    label.position.set(0, radius + 0.5, 0)
    mesh.add(label)
  })
}

function buildNeighborNodes() {
  layout.neighbors.forEach((n) => {
    const cfg = getMaturityConfig(n.level)
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(cfg.nodeColor),
      emissive: new THREE.Color(cfg.nodeColor),
      emissiveIntensity: 0.18,
      metalness: 0.2, roughness: 0.5,
      transparent: true, opacity: 0.78,
    })
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 18), mat)
    mesh.position.set(n.pos.x, n.pos.y, n.pos.z)
    mesh.userData = { ...n, kind: 'neighbor', baseRadius: 0.2 }
    scene.add(mesh)
    neighborMeshes.push(mesh)
    pickables.push(mesh)

    const div = document.createElement('div')
    div.className = 'node-label nb-label'
    div.textContent = n.name
    const label = new CSS2DObject(div)
    label.position.set(0, 0.42, 0)
    mesh.add(label)
    mesh.userData.labelEl = div  // hover/选中时显示
  })
}

function buildTube() {
  const pts = layout.nodes.map((n) => new THREE.Vector3(n.pos.x, n.pos.y, n.pos.z))
  if (pts.length < 2) return
  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.4)
  const geo = new THREE.TubeGeometry(curve, pts.length * 14, 0.07, 8, false)
  const mat = new THREE.MeshStandardMaterial({
    color: 0x409eff, emissive: 0x2f6fd0, emissiveIntensity: 0.7,
    metalness: 0.4, roughness: 0.3, transparent: true, opacity: 0.92,
  })
  const tube = new THREE.Mesh(geo, mat)
  tube.userData.isTube = true
  scene.add(tube)

  // 方向箭头：相邻路径点中点
  for (let i = 0; i < pts.length - 1; i++) {
    const mid = new THREE.Vector3().addVectors(pts[i], pts[i + 1]).multiplyScalar(0.5)
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(0.11, 0.32, 10),
      new THREE.MeshStandardMaterial({ color: 0x8fc4ff, emissive: 0x2f6fd0, emissiveIntensity: 0.6 })
    )
    cone.position.copy(mid)
    cone.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3().subVectors(pts[i + 1], pts[i]).normalize()
    )
    cone.userData.isArrow = true
    scene.add(cone)
  }
}

function buildNeighborLinks() {
  layout.links.forEach((lk) => {
    const cfg = getRelationConfig(lk.type)
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(lk.from.x, lk.from.y, lk.from.z),
      new THREE.Vector3(lk.to.x, lk.to.y, lk.to.z),
    ])
    const mat = new THREE.LineBasicMaterial({
      color: new THREE.Color(cfg.lineStyle.color),
      transparent: true, opacity: 0.22,
    })
    const line = new THREE.Line(geo, mat)
    line.userData.isLink = true
    scene.add(line)
  })
}

function buildLayers() {
  const total = layout.levels.length
  const diskR = layout.radius + 4.5
  layout.levels.forEach((depth, i) => {
    const y = depth * layout.layerGap
    // 细圆环描边
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(diskR - 0.04, diskR, 72),
      new THREE.MeshBasicMaterial({ color: 0x2b3f63, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
    )
    ring.rotation.x = -Math.PI / 2
    ring.position.y = y
    ring.userData.isLayer = true
    scene.add(ring)
    // 极淡填充盘
    const disk = new THREE.Mesh(
      new THREE.CircleGeometry(diskR, 64),
      new THREE.MeshBasicMaterial({ color: 0x16213a, transparent: true, opacity: 0.05, side: THREE.DoubleSide, depthWrite: false })
    )
    disk.rotation.x = -Math.PI / 2
    disk.position.y = y - 0.01
    disk.userData.isLayer = true
    scene.add(disk)
    // 侧标
    const div = document.createElement('div')
    div.className = 'layer-label'
    div.textContent = `第 ${i + 1} 层 · ${layerTier(i, total)}`
    const label = new CSS2DObject(div)
    label.position.set(diskR + 0.6, y, 0)
    scene.add(label)
  })
}

function layerTier(i, total) {
  if (total <= 1) return '核心'
  const r = i / (total - 1)
  if (r < 0.34) return '基础'
  if (r < 0.67) return '核心'
  return '应用'
}

function buildRing() {
  ringMesh = new THREE.Mesh(
    new THREE.RingGeometry(0.62, 0.78, 40),
    new THREE.MeshBasicMaterial({ color: 0xffd45e, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
  )
  ringMesh.visible = false
  scene.add(ringMesh)
}

/* ---------------- 高亮 ---------------- */
function applyHighlight(activeId) {
  pathMeshes.forEach((m) => {
    m.material.emissiveIntensity =
      activeId == null ? 0.5 : m.userData.id === activeId ? 1.5 : 0.14
  })
  neighborMeshes.forEach((m) => {
    m.material.emissiveIntensity = activeId == null ? 0.18 : 0.06
    m.material.opacity = activeId == null ? 0.78 : 0.4
  })
  if (activeId != null && ringMesh) {
    const m = pathMeshes.find((x) => x.userData.id === activeId)
    if (m) { ringMesh.position.copy(m.position); ringMesh.visible = true }
  } else if (ringMesh) {
    ringMesh.visible = false
  }
}

/* ---------------- 相机 ---------------- */
function fitOverview(intro = false) {
  const c = layout.bounds.center
  const r = layout.bounds.radius
  const fov = (camera.fov * Math.PI) / 180
  const dist = (r / Math.sin(fov / 2)) * 1.15
  goalTarget.set(c.x, c.y, c.z)
  goalPos.set(c.x + dist * 0.65, c.y + r * 0.7 + dist * 0.25, c.z + dist * 0.75)
  if (intro) {
    // 从更远处拉入
    camera.position.set(c.x + dist * 1.6, c.y + dist * 0.9, c.z + dist * 1.6)
    controls.target.set(c.x, c.y, c.z)
  }
  startTween()
}

function focusOn(worldPos, distance = 7) {
  const dir = new THREE.Vector3().subVectors(camera.position, controls.target).normalize()
  goalTarget.copy(worldPos)
  goalPos.copy(worldPos).addScaledVector(dir, distance)
  startTween()
}

function startTween() {
  tweening = true
  controls.autoRotate = false
  clearTimeout(idleTimer)
}

function scheduleIdle() {
  clearTimeout(idleTimer)
  idleTimer = setTimeout(() => {
    if (!userInteracting && !tweening && !tourActive.value) controls.autoRotate = true
  }, 4000)
}

/* ---------------- 漫游 ---------------- */
function startTour() {
  tourActive.value = true
  tourPlaying.value = true
  controls.autoRotate = false
  goTour(0)
}
function goTour(i) {
  const n = layout.nodes[i]
  if (!n) return
  tourIndex.value = i
  applyHighlight(n.id)
  selectedNode.value = { name: n.name, level: n.level, category: n.category, isPath: true }
  focusOn(new THREE.Vector3(n.pos.x, n.pos.y, n.pos.z), 6)
  clearTimeout(tourTimer)
  if (tourPlaying.value) {
    tourTimer = setTimeout(() => {
      if (!tourPlaying.value) return
      if (tourIndex.value < layout.nodes.length - 1) goTour(tourIndex.value + 1)
      else tourPlaying.value = false
    }, 2600)
  }
}
function tourNext() { tourPlaying.value = false; clearTimeout(tourTimer); if (tourIndex.value < layout.nodes.length - 1) goTour(tourIndex.value + 1) }
function tourPrev() { tourPlaying.value = false; clearTimeout(tourTimer); if (tourIndex.value > 0) goTour(tourIndex.value - 1) }
function toggleTourPlay() {
  tourPlaying.value = !tourPlaying.value
  if (tourPlaying.value) {
    if (tourIndex.value >= layout.nodes.length - 1) tourIndex.value = 0
    goTour(tourIndex.value)
  } else { clearTimeout(tourTimer) }
}
function exitTour() {
  tourActive.value = false
  tourPlaying.value = false
  clearTimeout(tourTimer)
  applyHighlight(null)
  selectedNode.value = null
  fitOverview()
  scheduleIdle()
}

/* ---------------- 交互绑定 ---------------- */
function bindInteraction() {
  onCtrlStart = () => { userInteracting = true; tweening = false; controls.autoRotate = false; clearTimeout(idleTimer) }
  onCtrlEnd = () => { userInteracting = false; if (!tourActive.value) scheduleIdle() }
  controls.addEventListener('start', onCtrlStart)
  controls.addEventListener('end', onCtrlEnd)

  onPointerMove = (e) => {
    setPointer(e)
    raycaster.setFromCamera(pointer, camera)
    const hits = raycaster.intersectObjects(pickables, false)
    const hit = hits.length ? hits[0].object : null
    if (hit === hovered) return
    // 还原上一个
    if (hovered) {
      hovered.scale.setScalar(1)
      if (hovered.userData.kind === 'neighbor' && hovered.userData.labelEl)
        hovered.userData.labelEl.classList.remove('show')
    }
    hovered = hit
    if (hovered) {
      hovered.scale.setScalar(1.18)
      if (hovered.userData.kind === 'neighbor' && hovered.userData.labelEl)
        hovered.userData.labelEl.classList.add('show')
    }
    renderer.domElement.style.cursor = hovered ? 'pointer' : 'default'
  }
  onClickScene = (e) => {
    setPointer(e)
    raycaster.setFromCamera(pointer, camera)
    const hits = raycaster.intersectObjects(pickables, false)
    if (!hits.length) { selectedNode.value = null; return }
    const u = hits[0].object.userData
    selectedNode.value = { name: u.name, level: u.level, category: u.category, isPath: u.kind === 'path' }
    focusOn(hits[0].object.position.clone(), u.kind === 'path' ? 6.5 : 5)
  }
  renderer.domElement.addEventListener('pointermove', onPointerMove)
  renderer.domElement.addEventListener('click', onClickScene)
}

function setPointer(e) {
  const rect = renderer.domElement.getBoundingClientRect()
  pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
  pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
}

/* ---------------- 渲染循环 ---------------- */
function animate() {
  animationId = requestAnimationFrame(animate)

  if (tweening) {
    camera.position.lerp(goalPos, 0.09)
    controls.target.lerp(goalTarget, 0.09)
    if (camera.position.distanceTo(goalPos) < 0.06 && controls.target.distanceTo(goalTarget) < 0.06) {
      tweening = false
      if (!tourActive.value) scheduleIdle()
    }
  }
  if (ringMesh?.visible) ringMesh.lookAt(camera.position)

  controls.update()
  renderer.render(scene, camera)
  labelRenderer.render(scene, camera)
}

function onResize() {
  if (!containerRef.value || !renderer) return
  const w = containerRef.value.clientWidth
  const h = containerRef.value.clientHeight
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.setSize(w, h)
  labelRenderer.setSize(w, h)
}

/* ---------------- 资源释放 ---------------- */
function disposeScene() {
  if (!scene) return
  scene.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose()
    if (obj.material) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
      mats.forEach((m) => m.dispose())
    }
  })
  pathMeshes = []; neighborMeshes = []; pickables = []; ringMesh = null
}
</script>

<template>
  <div class="review-container" ref="containerRef">
    <div class="review-topbar">
      <el-button text class="back-btn" @click="router.push('/')">← 返回图谱</el-button>
      <div class="review-title">
        <span>🗼</span>
        <h2>3D 知识依赖塔复盘</h2>
        <span v-if="pathData" class="path-label">{{ pathData.label }}</span>
      </div>

      <!-- 漫游控件 -->
      <div class="tour-bar">
        <template v-if="!tourActive">
          <el-button size="small" type="primary" @click="startTour">▶ 沿路径学习</el-button>
        </template>
        <template v-else>
          <button class="tour-btn" title="上一步" @click="tourPrev">⏮</button>
          <button class="tour-btn" :title="tourPlaying ? '暂停' : '播放'" @click="toggleTourPlay">
            {{ tourPlaying ? '⏸' : '▶' }}
          </button>
          <button class="tour-btn" title="下一步" @click="tourNext">⏭</button>
          <span class="tour-step">{{ tourIndex + 1 }}/{{ tourTotal }}</span>
          <button class="tour-btn exit" title="退出漫游" @click="exitTour">✕</button>
        </template>
      </div>
    </div>

    <!-- 坐标轴语义图例 -->
    <div class="axis-legend">
      <div class="al-row"><span class="al-y">⬆ 高度</span> 依赖深度（基础 → 应用）</div>
      <div class="al-row"><span class="al-a">↻ 方位</span> 学科归属（同向同学科）</div>
      <div class="al-row"><span class="al-dot path"></span> 路径节点 · <span class="al-dot nb"></span> 关联节点</div>
    </div>

    <div class="review-hint">单指/拖拽旋转 · 双指/滚轮缩放 · 点击节点聚焦</div>

    <!-- 节点信息面板 -->
    <transition name="info-slide">
      <div v-if="selectedNode" class="node-info">
        <div class="ni-header">
          <span class="ni-name">{{ selectedNode.name }}</span>
          <span class="ni-level" :style="{ color: getMaturityConfig(selectedNode.level).color }">
            {{ getMaturityConfig(selectedNode.level).label }}
          </span>
          <span class="ni-kind" :class="{ nb: !selectedNode.isPath }">
            {{ selectedNode.isPath ? '路径节点' : '关联节点' }}
          </span>
        </div>
        <p class="ni-category">{{ selectedNode.category }}</p>
      </div>
    </transition>

    <div v-if="!pathData" class="no-data">
      <p>无可用路径数据，请先生成学习路径。</p>
      <el-button type="primary" @click="router.push('/')">回到图谱</el-button>
    </div>
  </div>
</template>

<style>
/* CSS2D 标签（非 scoped，挂载到 body） */
.node-label {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  pointer-events: none;
}
.label-name {
  font-size: 12px; font-weight: 600; color: #fff;
  text-shadow: 0 1px 4px rgba(0,0,0,0.85); white-space: nowrap;
  background: rgba(13,17,23,0.6); padding: 1px 6px; border-radius: 3px;
}
.label-lvl { font-size: 10px; font-weight: 500; }
.nb-label {
  font-size: 11px; color: #cdd6e4; white-space: nowrap;
  background: rgba(13,17,23,0.65); padding: 1px 5px; border-radius: 3px;
  opacity: 0; transition: opacity 0.15s;
}
.nb-label.show { opacity: 1; }
.layer-label {
  font-size: 11px; color: #6b7da3; white-space: nowrap;
  letter-spacing: 0.5px; pointer-events: none;
}
</style>

<style scoped>
.review-container {
  width: 100vw; height: 100vh; position: relative; overflow: hidden;
  background: #0d1117;
}
.review-topbar {
  position: absolute; top: 0; left: 0; right: 0;
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 20px; gap: 12px;
  background: rgba(13,17,23,0.88); backdrop-filter: blur(8px);
  z-index: 10; border-bottom: 1px solid rgba(255,255,255,0.08);
}
.back-btn { color: #ccc; font-size: 14px; }
.back-btn:hover { color: #fff; }
.review-title { display: flex; align-items: center; gap: 10px; }
.review-title h2 { font-size: 17px; margin: 0; color: #fff; font-weight: 500; }
.path-label {
  font-size: 12px; padding: 2px 10px;
  background: rgba(64,158,255,0.25); color: #6db8ff; border-radius: 10px;
  white-space: nowrap;
}

/* 漫游控件 */
.tour-bar { display: flex; align-items: center; gap: 6px; }
.tour-btn {
  width: 30px; height: 30px; border: 1px solid rgba(255,255,255,0.15);
  background: rgba(255,255,255,0.06); color: #e6edf3; border-radius: 7px;
  font-size: 13px; cursor: pointer; transition: background 0.15s, border-color 0.15s;
  display: inline-flex; align-items: center; justify-content: center;
}
.tour-btn:hover { background: rgba(64,158,255,0.25); border-color: rgba(64,158,255,0.5); }
.tour-btn.exit:hover { background: rgba(232,51,51,0.25); border-color: rgba(232,51,51,0.5); }
.tour-step { font-size: 12px; color: #9aa7bd; min-width: 38px; text-align: center; }

/* 坐标轴图例 */
.axis-legend {
  position: absolute; left: 16px; bottom: 20px; z-index: 9;
  background: rgba(13,17,23,0.7); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px; padding: 10px 12px; backdrop-filter: blur(6px);
  font-size: 12px; color: #9aa7bd; line-height: 1.9;
}
.al-row { display: flex; align-items: center; gap: 6px; white-space: nowrap; }
.al-y, .al-a { color: #6db8ff; font-weight: 600; }
.al-dot { display: inline-block; width: 9px; height: 9px; border-radius: 50%; }
.al-dot.path { background: #F5C842; box-shadow: 0 0 6px #F5C842; }
.al-dot.nb { background: #6DB8FF; opacity: 0.7; }

.review-hint {
  position: absolute; top: 64px; right: 20px; z-index: 9;
  font-size: 12px; color: #6b7280;
}

/* 节点信息面板 */
.node-info {
  position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%);
  background: rgba(255,255,255,0.96); border-radius: 10px; padding: 12px 20px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3); z-index: 20; min-width: 220px; text-align: center;
}
.ni-header { display: flex; align-items: center; gap: 8px; justify-content: center; flex-wrap: wrap; }
.ni-name { font-size: 15px; font-weight: 600; color: #303133; }
.ni-level { font-size: 12px; font-weight: 500; }
.ni-kind {
  font-size: 11px; padding: 1px 8px; border-radius: 8px;
  background: rgba(245,200,66,0.2); color: #b6860a;
}
.ni-kind.nb { background: rgba(109,184,255,0.2); color: #2b7bd6; }
.ni-category { font-size: 12px; color: #909399; margin: 4px 0 0; }

.info-slide-enter-active, .info-slide-leave-active { transition: all 0.25s ease; }
.info-slide-enter-from, .info-slide-leave-to { opacity: 0; transform: translateX(-50%) translateY(10px); }

.no-data {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  height: 100%; color: #ccc; gap: 16px;
}

/* 移动端 */
@media (max-width: 768px) {
  .review-topbar { padding: 10px 12px; flex-wrap: wrap; gap: 8px; }
  .review-title { gap: 6px; order: 1; }
  .review-title h2 { font-size: 14px; }
  .tour-bar { order: 2; }
  .path-label { font-size: 11px; padding: 2px 8px; max-width: 120px; overflow: hidden; text-overflow: ellipsis; }
  .review-hint { display: none; }
  .axis-legend { left: 10px; bottom: 12px; padding: 8px 10px; font-size: 11px; line-height: 1.7; }
  .node-info { min-width: 0; width: min(92vw, 300px); padding: 10px 14px; }
}
</style>

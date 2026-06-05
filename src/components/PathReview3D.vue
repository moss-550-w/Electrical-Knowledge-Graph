<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGraphStore } from '@/stores/graphStore'
import { getMaturityConfig } from '@/utils/maturityTags'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js'

const router = useRouter()
const graphStore = useGraphStore()
const containerRef = ref(null)

let scene, camera, renderer, labelRenderer, controls
let cubeGroup, lineGroup
let animationId

const pathData = ref(graphStore.selectedPath)
const selectedNode = ref(null)   // 点击后显示信息

onMounted(() => {
  if (!pathData.value) { router.push('/'); return }
  initScene()
  buildPathScene()
  animate()
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  cancelAnimationFrame(animationId)
  renderer?.dispose()
  labelRenderer?.domElement.remove()
  controls?.dispose()
})

function initScene() {
  const container = containerRef.value
  const w = container.clientWidth
  const h = container.clientHeight

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)
  scene.fog = new THREE.Fog(0x1a1a2e, 20, 80)

  camera = new THREE.PerspectiveCamera(50, w / h, 0.5, 200)
  camera.position.set(12, 8, 18)
  camera.lookAt(0, 0, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(w, h)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  container.appendChild(renderer.domElement)

  // CSS2DRenderer —— 清晰 HTML 标签
  labelRenderer = new CSS2DRenderer()
  labelRenderer.setSize(w, h)
  labelRenderer.domElement.style.cssText =
    'position:absolute;top:0;left:0;pointer-events:none;'
  container.appendChild(labelRenderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.minDistance = 4
  controls.maxDistance = 50

  scene.add(new THREE.AmbientLight(0x404060, 2))
  const dir = new THREE.DirectionalLight(0xffffff, 3)
  dir.position.set(10, 20, 10)
  dir.castShadow = true
  scene.add(dir)
  scene.add(new THREE.GridHelper(30, 30, 0x334466, 0x223355))
}

function buildPathScene() {
  cubeGroup = new THREE.Group()
  lineGroup = new THREE.Group()
  scene.add(cubeGroup)
  scene.add(lineGroup)

  const nodes = pathData.value.path
  if (!nodes?.length) return

  const stepX = 3.0
  const startX = -(nodes.length - 1) * stepX / 2
  const positions = []
  const nodeObjects = []

  nodes.forEach((node, idx) => {
    const cfg = getMaturityConfig(node.level)
    const x = startX + idx * stepX
    const y = idx * 1.4
    const z = Math.sin(idx * 0.6) * 0.8
    positions.push(new THREE.Vector3(x, y, z))

    const size = node.level === 'L3' ? 0.9 : node.level === 'L2' ? 0.65 : 0.5
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(cfg.nodeColor),
      metalness: 0.3, roughness: 0.4,
      emissive: new THREE.Color(cfg.nodeBorderColor),
      emissiveIntensity: 0.3,
    })
    const cube = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), material)
    cube.position.set(x, y, z)
    cube.castShadow = true
    cube.userData = node
    cubeGroup.add(cube)
    nodeObjects.push(cube)

    // CSS2D 标签 —— 清晰中文，DPI 无关
    const div = document.createElement('div')
    div.className = 'node-label'
    div.innerHTML = `<span class="label-name">${node.name}</span><span class="label-lvl" style="color:${cfg.color}">${node.level}</span>`
    const label = new CSS2DObject(div)
    label.position.set(0, size / 2 + 0.5, 0)
    cube.add(label)
  })

  // 连线 + 箭头
  for (let i = 0; i < positions.length - 1; i++) {
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([positions[i], positions[i + 1]]),
      new THREE.LineBasicMaterial({ color: 0x409eff, transparent: true, opacity: 0.7 })
    )
    lineGroup.add(line)

    const mid = new THREE.Vector3().addVectors(positions[i], positions[i + 1]).multiplyScalar(0.5)
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(0.12, 0.35, 8),
      new THREE.MeshStandardMaterial({ color: 0x409eff, emissive: 0x204060, emissiveIntensity: 0.5 })
    )
    cone.position.copy(mid)
    cone.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3().subVectors(positions[i + 1], positions[i]).normalize()
    )
    lineGroup.add(cone)
  }

  // 节点点击 → 高亮 + 显示信息
  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()
  renderer.domElement.addEventListener('click', (e) => {
    const rect = renderer.domElement.getBoundingClientRect()
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    raycaster.setFromCamera(mouse, camera)
    const hits = raycaster.intersectObjects(nodeObjects)
    nodeObjects.forEach((o) => { o.material.emissiveIntensity = 0.3 })
    if (hits.length) {
      hits[0].object.material.emissiveIntensity = 1.5
      selectedNode.value = hits[0].object.userData
    } else {
      selectedNode.value = null
    }
  })
}

function animate() {
  animationId = requestAnimationFrame(animate)
  controls.update()
  if (!controls.isDragging) {
    cubeGroup.rotation.y += 0.001
    lineGroup.rotation.y += 0.001
  }
  renderer.render(scene, camera)
  labelRenderer.render(scene, camera)
}

function onResize() {
  if (!containerRef.value) return
  const w = containerRef.value.clientWidth
  const h = containerRef.value.clientHeight
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.setSize(w, h)
  labelRenderer.setSize(w, h)
}
</script>

<template>
  <div class="review-container" ref="containerRef">
    <div class="review-topbar">
      <el-button text class="back-btn" @click="router.push('/')">← 返回图谱</el-button>
      <div class="review-title">
        <span>📐</span>
        <h2>3D 学习路径复盘</h2>
        <span v-if="pathData" class="path-label">{{ pathData.label }}</span>
      </div>
      <div class="review-hint">拖拽旋转 · 滚轮缩放 · 右键平移</div>
    </div>

    <!-- 节点点击后信息面板 -->
    <transition name="info-slide">
      <div v-if="selectedNode" class="node-info">
        <div class="ni-header">
          <span class="ni-name">{{ selectedNode.name }}</span>
          <span class="ni-level"
            :style="{ color: getMaturityConfig(selectedNode.level).color }">
            {{ getMaturityConfig(selectedNode.level).label }}
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
/* CSS2D 标签样式（非 scoped，挂载到 body） */
.node-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  pointer-events: none;
}
.label-name {
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  text-shadow: 0 1px 4px rgba(0,0,0,0.8);
  white-space: nowrap;
  background: rgba(26,26,46,0.6);
  padding: 1px 6px;
  border-radius: 3px;
}
.label-lvl {
  font-size: 10px;
  font-weight: 500;
}
</style>

<style scoped>
.review-container {
  width: 100vw; height: 100vh;
  position: relative; overflow: hidden;
  background: #1a1a2e;
}
.review-topbar {
  position: absolute; top: 0; left: 0; right: 0;
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 20px;
  background: rgba(26,26,46,0.9); backdrop-filter: blur(8px);
  z-index: 10; border-bottom: 1px solid rgba(255,255,255,0.1);
}
.back-btn { color: #ccc; font-size: 14px; }
.back-btn:hover { color: #fff; }
.review-title { display: flex; align-items: center; gap: 10px; }
.review-title h2 { font-size: 17px; margin: 0; color: #fff; font-weight: 500; }
.path-label {
  font-size: 12px; padding: 2px 10px;
  background: rgba(64,158,255,0.25); color: #6db8ff; border-radius: 10px;
}
.review-hint { font-size: 12px; color: #888; }

/* 节点信息面板 */
.node-info {
  position: absolute; bottom: 24px; left: 50%;
  transform: translateX(-50%);
  background: rgba(255,255,255,0.95);
  border-radius: 10px; padding: 12px 20px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
  z-index: 20; min-width: 200px; text-align: center;
}
.ni-header { display: flex; align-items: center; gap: 8px; justify-content: center; }
.ni-name { font-size: 15px; font-weight: 600; color: #303133; }
.ni-level { font-size: 12px; font-weight: 500; }
.ni-category { font-size: 12px; color: #909399; margin: 4px 0 0; }

.info-slide-enter-active, .info-slide-leave-active { transition: all 0.25s ease; }
.info-slide-enter-from, .info-slide-leave-to { opacity: 0; transform: translateX(-50%) translateY(10px); }

.no-data {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; height: 100%; color: #ccc; gap: 16px;
}
</style>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGraphStore } from '@/stores/graphStore'
import { getMaturityConfig } from '@/utils/maturityTags'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

const router = useRouter()
const graphStore = useGraphStore()
const containerRef = ref(null)

let scene, camera, renderer, controls
let cubeGroup, lineGroup, labelSprites
let animationId

const pathData = ref(graphStore.selectedPath)

onMounted(() => {
  if (!pathData.value) {
    // 无路径数据时回退到图谱页
    router.push('/')
    return
  }
  initScene()
  buildPathScene()
  animate()
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  cancelAnimationFrame(animationId)
  renderer?.dispose()
  controls?.dispose()
})

function initScene() {
  const container = containerRef.value
  const w = container.clientWidth
  const h = container.clientHeight

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)
  scene.fog = new THREE.Fog(0x1a1a2e, 10, 80)

  camera = new THREE.PerspectiveCamera(50, w / h, 0.5, 200)
  camera.position.set(12, 8, 18)
  camera.lookAt(0, 0, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(w, h)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  container.appendChild(renderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.minDistance = 5
  controls.maxDistance = 50

  // 灯光
  const ambient = new THREE.AmbientLight(0x404060, 2)
  scene.add(ambient)

  const dirLight = new THREE.DirectionalLight(0xffffff, 3)
  dirLight.position.set(10, 20, 10)
  dirLight.castShadow = true
  scene.add(dirLight)

  // 网格地面
  const gridHelper = new THREE.GridHelper(30, 30, 0x334466, 0x223355)
  scene.add(gridHelper)
}

function buildPathScene() {
  cubeGroup = new THREE.Group()
  lineGroup = new THREE.Group()
  scene.add(cubeGroup)
  scene.add(lineGroup)

  const nodes = pathData.value.path
  if (!nodes || nodes.length === 0) return

  const stepX = 3.0
  const startX = -(nodes.length - 1) * stepX / 2

  const positions = []
  const nodeObjects = []

  nodes.forEach((node, idx) => {
    const cfg = getMaturityConfig(node.level)
    const x = startX + idx * stepX
    const y = idx * 1.4 // 阶梯上升
    const z = Math.sin(idx * 0.6) * 0.8 // 轻微 Z 轴偏移增加立体感

    positions.push(new THREE.Vector3(x, y, z))

    // 立方体
    const size = node.level === 'L3' ? 0.9 : node.level === 'L2' ? 0.65 : 0.5
    const geometry = new THREE.BoxGeometry(size, size, size)
    const hsl = hexToHSL(cfg.nodeColor)
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(cfg.nodeColor),
      metalness: 0.3,
      roughness: 0.4,
      emissive: new THREE.Color(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l * 0.3}%)`),
      emissiveIntensity: 0.4,
    })
    const cube = new THREE.Mesh(geometry, material)
    cube.position.set(x, y, z)
    cube.castShadow = true
    cube.receiveShadow = true
    cube.userData = { nodeId: node.id, nodeName: node.name, level: node.level }
    cubeGroup.add(cube)
    nodeObjects.push(cube)

    // 文字标签（使用 canvas texture）
    const labelSprite = createLabel(node.name, cfg.nodeColor)
    labelSprite.position.set(x, y + size / 2 + 0.6, z)
    labelSprite.scale.set(3, 1.2, 1)
    cubeGroup.add(labelSprite)

    // 层级标签
    const levelSprite = createLabel(`[${node.level}]`, '#ffffff', 0.6)
    levelSprite.position.set(x, y + size / 2 + 0.1, z)
    levelSprite.scale.set(1.5, 0.6, 1)
    cubeGroup.add(levelSprite)
  })

  // 连线
  for (let i = 0; i < positions.length - 1; i++) {
    const points = [positions[i], positions[i + 1]]
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points)
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x409EFF,
      transparent: true,
      opacity: 0.7,
      linewidth: 1,
    })
    const line = new THREE.Line(lineGeo, lineMat)
    lineGroup.add(line)

    // 箭头（小圆锥替代）
    const midPoint = new THREE.Vector3().addVectors(positions[i], positions[i + 1]).multiplyScalar(0.5)
    const arrowGeo = new THREE.ConeGeometry(0.15, 0.4, 8)
    const arrowMat = new THREE.MeshStandardMaterial({ color: 0x409EFF, emissive: 0x204060, emissiveIntensity: 0.5 })
    const arrow = new THREE.Mesh(arrowGeo, arrowMat)
    arrow.position.copy(midPoint)
    // 指向下一个节点方向
    const dir = new THREE.Vector3().subVectors(positions[i + 1], positions[i]).normalize()
    arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
    lineGroup.add(arrow)
  }

  // Raycaster for click
  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()
  const clickHandler = (event) => {
    const rect = renderer.domElement.getBoundingClientRect()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObjects(nodeObjects)
    if (intersects.length > 0) {
      const obj = intersects[0].object
      // 高亮选中节点
      nodeObjects.forEach((o) => {
        o.material.emissiveIntensity = 0.4
      })
      obj.material.emissive.set(0xffffff)
      obj.material.emissiveIntensity = 1.2
    }
  }
  renderer.domElement.addEventListener('click', clickHandler)
}

function createLabel(text, color, scale = 1.0) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = 'rgba(0,0,0,0)'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.font = 'bold 28px "Microsoft YaHei", Arial, sans-serif'
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, canvas.width / 2, canvas.height / 2)

  const texture = new THREE.CanvasTexture(canvas)
  texture.minFilter = THREE.LinearFilter
  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  })
  const sprite = new THREE.Sprite(spriteMaterial)
  sprite.scale.set(3 * scale, 0.75 * scale, 1)
  return sprite
}

function hexToHSL(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h, s, l = (max + min) / 2
  if (max === min) { h = s = 0 }
  else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 }
}

function animate() {
  animationId = requestAnimationFrame(animate)
  controls.update()

  // 缓慢自转（当用户不操作时）
  if (!controls.isDragging) {
    cubeGroup.rotation.y += 0.001
    lineGroup.rotation.y += 0.001
  }

  renderer.render(scene, camera)
}

function onResize() {
  if (!containerRef.value) return
  const w = containerRef.value.clientWidth
  const h = containerRef.value.clientHeight
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.setSize(w, h)
}

function goBack() {
  router.push('/')
}
</script>

<template>
  <div class="review-container" ref="containerRef">
    <div class="review-topbar">
      <el-button text @click="goBack" class="back-btn">
        ← 返回图谱
      </el-button>
      <div class="review-title">
        <span class="title-icon">📐</span>
        <h2>3D 学习路径复盘</h2>
        <span v-if="pathData" class="path-label">{{ pathData.label }}</span>
      </div>
      <div class="review-hint">
        拖拽旋转 · 滚轮缩放 · 右键平移
      </div>
    </div>

    <div v-if="!pathData" class="no-data">
      <p>无可用路径数据，请先在知识图谱中生成学习路径。</p>
      <el-button type="primary" @click="goBack">回到图谱</el-button>
    </div>
  </div>
</template>

<style scoped>
.review-container {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background: #1a1a2e;
}

.review-topbar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: rgba(26, 26, 46, 0.9);
  backdrop-filter: blur(8px);
  z-index: 10;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.back-btn {
  color: #ccc;
  font-size: 14px;
}

.back-btn:hover {
  color: #fff;
}

.review-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-icon {
  font-size: 22px;
}

.review-title h2 {
  font-size: 17px;
  margin: 0;
  color: #fff;
  font-weight: 500;
}

.path-label {
  font-size: 12px;
  padding: 2px 10px;
  background: rgba(64, 158, 255, 0.25);
  color: #6db8ff;
  border-radius: 10px;
}

.review-hint {
  font-size: 12px;
  color: #888;
}

.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #ccc;
  gap: 16px;
}
</style>

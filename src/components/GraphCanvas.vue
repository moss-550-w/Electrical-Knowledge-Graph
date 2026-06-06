<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { useGraphStore } from '@/stores/graphStore'
import { useHistoryStore } from '@/stores/historyStore'
import { buildGraphOption, loadGraphToStore } from '@/utils/graphBuilder'

const graphStore = useGraphStore()
const historyStore = useHistoryStore()
const chartRef = ref(null)
const glowRef = ref(null)
let chartInstance = null
let themeObserver = null
let animId = null
let particles = []

onMounted(async () => {
  await nextTick()
  initChart()
  window.addEventListener('resize', handleResize)
  // 监听 html class 变化（主题切换）→ 重新渲染图谱背景
  themeObserver = new MutationObserver(() => renderChart())
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  cancelAnimationFrame(animId)
  themeObserver?.disconnect()
  // 保存视角
  if (chartInstance) {
    const opt = chartInstance.getOption()
    const s = opt?.series?.[0]
    if (s?.zoom && s?.center) historyStore.saveViewport(s.zoom, s.center)
  }
  chartInstance?.dispose()
})

function initChart() {
  if (!chartRef.value) return
  chartInstance = echarts.init(chartRef.value, null, { renderer: 'canvas' })
  graphStore.graphInstance = chartInstance

  if (graphStore.nodes.length === 0) loadGraphToStore(graphStore)

  renderChart()

  // 恢复上次视角
  const vp = historyStore.savedViewport
  if (vp?.zoom && vp?.center) {
    setTimeout(() => {
      chartInstance?.setOption({ series: [{ zoom: vp.zoom, center: vp.center }] }, { replaceMerge: [] })
    }, 800)
  }

  chartInstance.on('click', (params) => {
    if (params.dataType === 'node') {
      graphStore.setFocusNode(params.data.id)
      focusCamera(params.data.id)
    } else {
      graphStore.clearFocus()
    }
  })

  graphStore.graphReady = true
  startGlow()
}

// ── 运镜聚焦 ─────────────────────────────────────────
function focusCamera(nodeId) {
  if (!chartInstance) return
  const model = chartInstance.getModel()
  const seriesModel = model?.getSeriesByIndex(0)
  if (!seriesModel) return

  const nodeIdx = graphStore.visibleNodes.findIndex((n) => n.id === nodeId)
  if (nodeIdx < 0) return

  const layout = seriesModel.getData().getItemLayout(nodeIdx)
  if (!layout) return

  // 平滑缩放并平移视口中心到焦点节点
  chartInstance.setOption({
    series: [{
      zoom: 2.0,
      center: layout,
    }]
  }, { replaceMerge: [] })
}

// ── 图谱渲染 ──────────────────────────────────────────
function renderChart() {
  if (!chartInstance) return
  const option = buildGraphOption(
    graphStore.visibleNodes,
    graphStore.visibleEdges,
    {
      focusNodeId: graphStore.focusNodeId,
      highlightedPathIds: graphStore.highlightedPathIds,
      traceMode: graphStore.traceMode,
      visitedIds: historyStore.visitedIds,
    }
  )
  chartInstance.setOption(option, true)
  particles = []
}

// ── 流光动画 + 波浪线 ─────────────────────────────────
let wavePhase = 0

function startGlow() {
  const canvas = glowRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')

  function loop() {
    animId = requestAnimationFrame(loop)
    const w = canvas.width
    const h = canvas.height
    ctx.clearRect(0, 0, w, h)
    wavePhase += 0.06

    // 绘制 suggest_sync 波浪线
    drawWaveEdges(ctx)

    // 流光粒子
    if (graphStore.highlightedPathIds.length > 1) spawnParticles()
    particles = particles.filter((p) => p.life > 0)
    particles.forEach((p) => {
      p.x += p.vx; p.y += p.vy; p.life -= 1.5
      const alpha = Math.max(0, p.life / p.maxLife)
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r * alpha, 0, Math.PI * 2)
      const color = graphStore.traceMode ? `rgba(232,51,51,${alpha * 0.9})` : `rgba(64,158,255,${alpha * 0.9})`
      ctx.fillStyle = color
      ctx.shadowBlur = 6; ctx.shadowColor = color; ctx.fill()
    })
    ctx.shadowBlur = 0
  }
  loop()
}

function getNodePixel(nodeId) {
  if (!chartInstance) return null
  const model = chartInstance.getModel()
  const sm = model?.getSeriesByIndex(0)
  if (!sm) return null
  const idx = graphStore.visibleNodes.findIndex((n) => n.id === nodeId)
  if (idx < 0) return null
  const layout = sm.getData().getItemLayout(idx)
  if (!layout) return null
  const [px, py] = chartInstance.convertToPixel({ seriesIndex: 0 }, [layout[0], layout[1]])
  return isNaN(px) ? null : [px, py]
}

function drawWaveEdges(ctx) {
  const syncEdges = graphStore.visibleEdges.filter((e) => e.type === 'suggest_sync')
  if (!syncEdges.length) return

  syncEdges.forEach((e) => {
    const src = getNodePixel(e.source)
    const tgt = getNodePixel(e.target)
    if (!src || !tgt) return

    const [sx, sy] = src
    const [tx, ty] = tgt
    const len = Math.hypot(tx - sx, ty - sy) || 1
    // 法向量（垂直于边方向）
    const nx = -(ty - sy) / len
    const ny = (tx - sx) / len

    const segments = Math.floor(len / 8)
    const amp = 4  // 波浪振幅（像素）

    ctx.beginPath()
    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      const bx = sx + (tx - sx) * t
      const by = sy + (ty - sy) * t
      const wave = Math.sin(t * Math.PI * 6 + wavePhase) * amp
      const x = bx + nx * wave
      const y = by + ny * wave
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.strokeStyle = 'rgba(230,168,23,0.55)'
    ctx.lineWidth = 1.5
    ctx.setLineDash([])
    ctx.stroke()
  })
}

function spawnParticles() {
  if (!chartInstance) return
  const highlightSet = new Set(graphStore.highlightedPathIds)
  const edges = graphStore.visibleEdges.filter(
    (e) => highlightSet.has(e.source) && highlightSet.has(e.target)
  )

  // 每帧最多为 3 条边各生成 1 个粒子
  const sample = edges.slice(0, 3)
  sample.forEach((e) => {
    const srcNode = graphStore.visibleNodes.find((n) => n.id === e.source)
    const tgtNode = graphStore.visibleNodes.find((n) => n.id === e.target)
    if (!srcNode || !tgtNode) return

    // ECharts graph 节点的屏幕位置需通过内部模型获取
    const model = chartInstance.getModel()
    const seriesModel = model?.getSeriesByIndex(0)
    if (!seriesModel) return

    const srcIdx = graphStore.visibleNodes.indexOf(srcNode)
    const tgtIdx = graphStore.visibleNodes.indexOf(tgtNode)
    const srcItem = seriesModel.getData().getItemLayout(srcIdx)
    const tgtItem = seriesModel.getData().getItemLayout(tgtIdx)
    if (!srcItem || !tgtItem) return

    // 逻辑坐标 → 像素坐标
    const [sx, sy] = chartInstance.convertToPixel({ seriesIndex: 0 }, [srcItem[0], srcItem[1]])
    const [tx, ty] = chartInstance.convertToPixel({ seriesIndex: 0 }, [tgtItem[0], tgtItem[1]])
    if (isNaN(sx) || isNaN(tx)) return

    // 随机起点（沿边）
    const t0 = Math.random()
    const x = sx + (tx - sx) * t0
    const y = sy + (ty - sy) * t0
    const speed = 1.5 + Math.random()
    const len = Math.hypot(tx - sx, ty - sy) || 1
    const maxLife = 40 + Math.random() * 30

    particles.push({
      x, y,
      vx: (tx - sx) / len * speed,
      vy: (ty - sy) / len * speed,
      r: 2.5,
      life: maxLife,
      maxLife,
    })
  })
}

watch(
  () => [graphStore.focusNodeId, graphStore.highlightedPathIds, graphStore.traceMode],
  () => renderChart(),
  { deep: true }
)

watch(
  () => [graphStore.showL1Nodes, graphStore.showL2Nodes, graphStore.showL3Nodes],
  () => renderChart()
)

function handleResize() {
  chartInstance?.resize()
  if (glowRef.value) {
    glowRef.value.width = glowRef.value.offsetWidth
    glowRef.value.height = glowRef.value.offsetHeight
  }
}
</script>

<template>
  <div class="graph-wrap">
    <div class="graph-canvas" ref="chartRef"></div>
    <canvas class="glow-canvas" ref="glowRef"
            :width="chartRef?.offsetWidth"
            :height="chartRef?.offsetHeight" />
  </div>
</template>

<style scoped>
.graph-wrap {
  width: 100%;
  height: 100%;
  position: relative;
}
.graph-canvas {
  width: 100%;
  height: 100%;
  min-height: 100vh;
}
.glow-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>

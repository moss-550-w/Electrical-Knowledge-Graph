<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { useGraphStore } from '@/stores/graphStore'
import { buildGraphOption, loadGraphToStore } from '@/utils/graphBuilder'

const graphStore = useGraphStore()
const chartRef = ref(null)
let chartInstance = null

onMounted(async () => {
  await nextTick()
  initChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
})

function initChart() {
  if (!chartRef.value) return
  chartInstance = echarts.init(chartRef.value, null, { renderer: 'canvas' })
  graphStore.graphInstance = chartInstance

  // 首次加载数据
  if (graphStore.nodes.length === 0) {
    loadGraphToStore(graphStore)
  }

  renderChart()

  // 节点点击事件
  chartInstance.on('click', (params) => {
    if (params.dataType === 'node') {
      graphStore.setFocusNode(params.data.id)
    } else {
      graphStore.clearFocus()
    }
  })

  graphStore.graphReady = true
}

function renderChart() {
  if (!chartInstance) return
  const option = buildGraphOption(
    graphStore.visibleNodes,
    graphStore.visibleEdges,
    {
      focusNodeId: graphStore.focusNodeId,
      highlightedPathIds: graphStore.highlightedPathIds,
      traceMode: graphStore.traceMode,
    }
  )
  chartInstance.setOption(option, true)
}

// 监听状态变化，重新渲染
watch(
  () => [
    graphStore.focusNodeId,
    graphStore.highlightedPathIds,
    graphStore.traceMode,
  ],
  () => {
    renderChart()
  },
  { deep: true }
)

watch(
  () => [graphStore.showL1Nodes, graphStore.showL2Nodes, graphStore.showL3Nodes],
  () => {
    renderChart()
  }
)

function handleResize() {
  chartInstance?.resize()
}
</script>

<template>
  <div class="graph-canvas" ref="chartRef"></div>
</template>

<style scoped>
.graph-canvas {
  width: 100%;
  height: 100%;
  min-height: 100vh;
}
</style>

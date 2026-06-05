import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useGraphStore = defineStore('graph', () => {
  // ===== 原始数据 =====
  const nodes = ref([])
  const edges = ref([])

  // ===== 图谱状态 =====
  const focusNodeId = ref(null)
  const highlightedPathIds = ref([])
  const traceMode = ref(false)
  const graphInstance = ref(null)
  const graphReady = ref(false)

  // ===== 路径状态 =====
  const selectedPath = ref(null)
  const savedPaths = ref([])

  // ===== 过滤状态 =====
  const showL1Nodes = ref(true)
  const showL2Nodes = ref(true)
  const showL3Nodes = ref(true)

  // ===== 计算属性 =====
  const focusNode = computed(() =>
    nodes.value.find((n) => n.id === focusNodeId.value) || null
  )

  const visibleNodes = computed(() =>
    nodes.value.filter((n) => {
      if (n.level === 'L1' && !showL1Nodes.value) return false
      if (n.level === 'L2' && !showL2Nodes.value) return false
      if (n.level === 'L3' && !showL3Nodes.value) return false
      return true
    })
  )

  const visibleNodeIds = computed(() =>
    new Set(visibleNodes.value.map((n) => n.id))
  )

  const visibleEdges = computed(() =>
    edges.value.filter(
      (e) =>
        visibleNodeIds.value.has(e.source) && visibleNodeIds.value.has(e.target)
    )
  )

  // ===== 依存关系 =====
  const nodeAdjacency = computed(() => {
    const adj = { upstream: {}, downstream: {} }
    nodes.value.forEach((n) => {
      adj.upstream[n.id] = []
      adj.downstream[n.id] = []
    })
    edges.value.forEach((e) => {
      if (e.type === 'depends_on') {
        adj.upstream[e.target]?.push(e.source)
        adj.downstream[e.source]?.push(e.target)
      }
    })
    return adj
  })

  // ===== Actions =====
  function loadData(nodeList, edgeList) {
    nodes.value = nodeList
    edges.value = edgeList
  }

  function setFocusNode(nodeId) {
    if (focusNodeId.value === nodeId) {
      focusNodeId.value = null
      highlightedPathIds.value = []
      return
    }
    focusNodeId.value = nodeId
    updateHighlightedPath(nodeId)
  }

  function clearFocus() {
    focusNodeId.value = null
    highlightedPathIds.value = []
  }

  function updateHighlightedPath(nodeId) {
    if (!traceMode.value) {
      // 正常模式：高亮上下游各 2 层
      const ids = new Set()
      const visited = new Set()
      function traverse(id, direction, depth) {
        if (depth > 2 || visited.has(`${id}-${direction}-${depth}`)) return
        visited.add(`${id}-${direction}-${depth}`)
        ids.add(id)
        const neighbors =
          direction === 'up'
            ? nodeAdjacency.value.upstream[id] || []
            : nodeAdjacency.value.downstream[id] || []
        neighbors.forEach((nid) => traverse(nid, direction, depth + 1))
      }
      traverse(nodeId, 'up', 0)
      traverse(nodeId, 'down', 0)
      highlightedPathIds.value = [...ids]
    } else {
      // 溯源模式：仅逆向追溯所有 depends_on
      const ids = new Set()
      function traceUp(id) {
        if (ids.has(id)) return
        ids.add(id)
        ;(nodeAdjacency.value.upstream[id] || []).forEach(traceUp)
      }
      traceUp(nodeId)
      highlightedPathIds.value = [...ids]
    }
  }

  function toggleTraceMode() {
    traceMode.value = !traceMode.value
    if (focusNodeId.value) {
      updateHighlightedPath(focusNodeId.value)
    }
  }

  function setSelectedPath(path) {
    selectedPath.value = path
    savedPaths.value.push(path)
  }

  function toggleLevel(level) {
    if (level === 'L1') showL1Nodes.value = !showL1Nodes.value
    if (level === 'L2') showL2Nodes.value = !showL2Nodes.value
    if (level === 'L3') showL3Nodes.value = !showL3Nodes.value
  }

  return {
    nodes, edges, focusNodeId, highlightedPathIds, traceMode,
    graphInstance, graphReady, selectedPath, savedPaths,
    showL1Nodes, showL2Nodes, showL3Nodes,
    focusNode, visibleNodes, visibleNodeIds, visibleEdges, nodeAdjacency,
    loadData, setFocusNode, clearFocus, updateHighlightedPath,
    toggleTraceMode, setSelectedPath, toggleLevel,
  }
})

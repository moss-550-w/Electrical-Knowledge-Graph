import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useHistoryStore } from './historyStore'
import { computeThreadNodeIds } from '@/data/threads'

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

  // ===== 主线（金线窗口）状态 =====
  const activeThread = ref('all') // 'all' | 'motor' | 'storage'

  // 各主线节点集合（仅随边数据变化重算）
  const threadMembership = computed(() => ({
    motor: computeThreadNodeIds('motor', edges.value),
    storage: computeThreadNodeIds('storage', edges.value),
  }))

  // ===== 计算属性 =====
  const focusNode = computed(() =>
    nodes.value.find((n) => n.id === focusNodeId.value) || null
  )

  const visibleNodes = computed(() => {
    const threadSet =
      activeThread.value === 'all' ? null : threadMembership.value[activeThread.value]
    return nodes.value.filter((n) => {
      if (n.level === 'L1' && !showL1Nodes.value) return false
      if (n.level === 'L2' && !showL2Nodes.value) return false
      if (n.level === 'L3' && !showL3Nodes.value) return false
      if (threadSet && !threadSet.has(n.id)) return false
      return true
    })
  })

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
    // 记录访问历史
    const node = nodes.value.find((n) => n.id === nodeId)
    if (node) useHistoryStore().recordVisit(node)
  }

  function clearFocus() {
    focusNodeId.value = null
    highlightedPathIds.value = []
  }

  function setThread(key) {
    if (activeThread.value === key) return
    activeThread.value = key
    clearFocus()
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

  /**
   * 返回与 nodeId 跨学科的隐性关联节点（二度邻居，不同学科，权重最高的前3个）
   */
  function getCrossFieldNodes(nodeId) {
    const srcNode = nodes.value.find((n) => n.id === nodeId)
    if (!srcNode) return []
    const srcCategory = srcNode.category

    // 一度邻居 id 集合
    const directNeighborIds = new Set(
      edges.value
        .filter((e) => e.source === nodeId || e.target === nodeId)
        .map((e) => (e.source === nodeId ? e.target : e.source))
    )
    directNeighborIds.add(nodeId)

    // 二度邻居（邻居的邻居），过滤掉同学科和已知直接关联
    const candidates = new Map() // id -> 累计权重
    directNeighborIds.forEach((nid) => {
      edges.value
        .filter((e) => e.source === nid || e.target === nid)
        .forEach((e) => {
          const otherId = e.source === nid ? e.target : e.source
          if (directNeighborIds.has(otherId)) return
          const otherNode = nodes.value.find((n) => n.id === otherId)
          if (!otherNode || otherNode.category === srcCategory) return
          candidates.set(otherId, (candidates.get(otherId) || 0) + e.weight)
        })
    })

    return [...candidates.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => nodes.value.find((n) => n.id === id))
      .filter(Boolean)
  }

  return {
    nodes, edges, focusNodeId, highlightedPathIds, traceMode,
    graphInstance, graphReady, selectedPath, savedPaths,
    showL1Nodes, showL2Nodes, showL3Nodes,
    activeThread, threadMembership,
    focusNode, visibleNodes, visibleNodeIds, visibleEdges, nodeAdjacency,
    loadData, setFocusNode, clearFocus, updateHighlightedPath,
    toggleTraceMode, setSelectedPath, toggleLevel, getCrossFieldNodes,
    setThread,
  }
})

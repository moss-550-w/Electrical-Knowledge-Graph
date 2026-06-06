import { getMaturityConfig, getRelationConfig } from './maturityTags'
import goldThread from '@/data/goldThread.json'
import skeleton from '@/data/skeletonGraph.json'

/**
 * 合并金线数据与骨架数据，构建 ECharts graph 配置
 * @returns {{ nodes: Array, edges: Array }}
 */
export function loadGraphData() {
  const nodeMap = new Map()

  // 处理金线节点
  goldThread.forEach((item) => {
    nodeMap.set(item.id, { ...item, isGold: true })
  })

  // 处理骨架节点（不覆盖金线节点）
  skeleton.forEach((item) => {
    if (!nodeMap.has(item.id)) {
      nodeMap.set(item.id, { ...item, isGold: false })
    }
  })

  // 收集所有边
  const edgeSet = new Set()
  const edges = []

  nodeMap.forEach((node) => {
    if (node.relations) {
      node.relations.forEach((rel) => {
        const key = `${node.id}->${rel.target}:${rel.type}`
        if (!edgeSet.has(key) && nodeMap.has(rel.target)) {
          edgeSet.add(key)
          edges.push({
            source: node.id,
            target: rel.target,
            type: rel.type,
            weight: rel.weight,
          })
        }
      })
    }
  })

  const nodes = [...nodeMap.values()]
  return { nodes, edges }
}

/**
 * 构建 ECharts graph option
 * @param {Array} nodes - 节点列表
 * @param {Array} edges - 边列表
 * @param {Object} state - graphStore 状态（focusNodeId, highlightedPathIds, traceMode）
 * @returns {Object} ECharts option
 */
export function buildGraphOption(nodes, edges, state = {}) {
  const { focusNodeId, highlightedPathIds = [], traceMode = false, visitedIds = new Set() } = state
  const highlightSet = new Set(highlightedPathIds)
  const highlightActive = highlightSet.size > 0

  // 计算焦点节点的直接邻居（一度关联）
  const directNeighbors = new Set()
  if (focusNodeId) {
    edges.forEach((e) => {
      if (e.source === focusNodeId) directNeighbors.add(e.target)
      if (e.target === focusNodeId) directNeighbors.add(e.source)
    })
  }

  const graphNodes = nodes.map((n) => {
    const cfg = getMaturityConfig(n.level)
    const isFocus = n.id === focusNodeId
    const isNeighbor = directNeighbors.has(n.id)
    const isHighlight = highlightSet.has(n.id)
    // 有焦点时：直接邻居次级高亮，其余深度淡出
    const dimmed = focusNodeId
      ? !isFocus && !isNeighbor
      : highlightActive && !isHighlight

    // 焦点节点大幅放大；直接邻居中幅放大；其余正常
    const sizeMultiplier = isFocus ? 2.0 : isNeighbor ? 1.3 : 1.0
    const symbolSize = Math.round(cfg.symbolSize * sizeMultiplier)

    return {
      id: n.id,
      name: n.name,
      symbolSize,
      category: n.category || 0,
      itemStyle: {
        color: cfg.nodeColor,
        borderColor: isFocus ? '#FF6B35' : isNeighbor ? '#409EFF' : cfg.nodeBorderColor,
        borderWidth: isFocus ? 4 : isNeighbor ? 2.5 : 1.5,
        opacity: dimmed ? 0.08 : 1.0,
        shadowBlur: isFocus ? 30 : isNeighbor ? 12 : 0,
        shadowColor: isFocus ? 'rgba(255,107,53,0.8)' : 'rgba(64,158,255,0.5)',
      },
      label: {
        show: isFocus || isNeighbor || cfg.symbolSize >= 36,
        fontSize: isFocus ? 15 : isNeighbor ? 12 : 11,
        fontWeight: isFocus || isNeighbor ? 'bold' : 'normal',
        color: dimmed ? '#484f58' : isFocus ? '#FF6B35' : '#e6edf3',
        formatter: () => {
          const visited = visitedIds.has(n.id)
          const prefix = isFocus ? '★ ' : visited ? '👣 ' : ''
          return prefix + n.name
        },
      },
      tooltip: {
        formatter: () => {
          const tag = getMaturityConfig(n.level).label
          return `<b>${n.name}</b><br/>${n.summary || ''}<br/><span style="color:${cfg.color}">${tag}</span>${n.isGold ? ' 🔶金线' : ''}`
        },
      },
    }
  })

  // 构建 ECharts 边 — 语义形状语言
  const graphEdges = edges.map((e) => {
    const onPath = highlightSet.has(e.source) && highlightSet.has(e.target)
    const dimmedEdge = (highlightActive || !!focusNodeId) && !onPath

    // 每种关系类型独立视觉语言
    const EDGE_STYLE = {
      depends_on:    { color: '#E83333', width: 2.5, type: 'solid',  curveness: 0.15, opacity: 0.85 },
      strong_related:{ color: '#409EFF', width: 1.5, type: 'solid',  curveness: 0.2,  opacity: 0.6  },
      maps_to:       { color: '#67C23A', width: 2,   type: 'dashed', curveness: 0.28, opacity: 0.75 },
      suggest_sync:  { color: '#E6A817', width: 1.5, type: 'dotted', curveness: 0.35, opacity: 0.45 },
    }
    const s = EDGE_STYLE[e.type] || EDGE_STYLE.strong_related

    // 箭头：depends_on 和 maps_to 用较大箭头，其余无箭头
    const hasArrow = e.type === 'depends_on' || e.type === 'maps_to'

    return {
      source: e.source,
      target: e.target,
      symbol: ['none', hasArrow ? 'arrow' : 'none'],
      symbolSize: e.type === 'depends_on' ? [0, 10] : [0, 7],
      lineStyle: {
        color: onPath ? (e.type === 'depends_on' ? '#FF6B35' : '#66ffcc') : s.color,
        width: onPath ? s.width + 1.5 : s.width,
        type: s.type,
        curveness: s.curveness,
        opacity: dimmedEdge ? 0.06 : s.opacity,
        shadowBlur: onPath ? 8 : 0,
        shadowColor: onPath ? s.color : 'transparent',
      },
      label: {
        show: onPath && e.type !== 'suggest_sync',
        formatter: () => {
          const labels = { depends_on: '依赖', maps_to: '映射', strong_related: '关联', suggest_sync: '同步' }
          return labels[e.type] || ''
        },
        fontSize: 10,
        color: '#aaa',
        backgroundColor: 'rgba(13,17,23,0.7)',
        padding: [2, 4],
        borderRadius: 3,
      },
      _type: e.type,
    }
  })

  const categories = buildCategories(nodes)

  // 计算拓扑深度，用于入场动画延迟
  const depthMap = computeDepth(nodes, edges)

  const isLight = document.documentElement.classList.contains('light')
  return {
    backgroundColor: isLight ? '#f5f7fa' : '#0d1117',
    tooltip: {
      show: true,
      trigger: 'item',
      backgroundColor: isLight ? 'rgba(255,255,255,0.97)' : 'rgba(22,27,34,0.95)',
      borderColor: isLight ? 'rgba(220,223,230,0.9)' : 'rgba(48,54,61,0.8)',
      textStyle: { color: isLight ? '#303133' : '#e6edf3', fontSize: 13 },
    },
    legend: {
      show: true,
      bottom: 10,
      data: categories.map((c) => c.name),
      textStyle: { fontSize: 11, color: isLight ? '#606266' : '#8b949e' },
      backgroundColor: isLight ? 'rgba(255,255,255,0.8)' : 'rgba(13,17,23,0.6)',
      borderColor: 'rgba(48,54,61,0.5)',
      borderWidth: 1,
      borderRadius: 6,
    },
    series: [
      {
        type: 'graph',
        layout: 'force',
        roam: true,
        draggable: true,
        zoom: 1.2,
        scaleLimit: { min: 0.3, max: 5 },
        categories,
        nodes: graphNodes.map((n, i) => {
          const depth = depthMap.get(n.id) || 0
          return {
            ...n,
            // 金线节点最后高亮爆发（delay 更长），其余按深度分层依次出现
            animationDelay: nodes[i]?.isGold ? depth * 60 + 400 : depth * 60,
          }
        }),
        edges: graphEdges,
        force: {
          repulsion: 600,
          gravity: 0.08,
          edgeLength: [120, 280],
          layoutAnimation: true,
          friction: 0.6,
        },
        emphasis: {
          focus: 'adjacency',
          lineStyle: { width: 4 },
        },
        edgeSymbol: ['none', 'arrow'],
        edgeSymbolSize: [0, 8],
        itemStyle: { borderWidth: 1.5 },
        lineStyle: { opacity: 0.5, curveness: 0.2 },
      },
    ],
    animationDuration: 1200,
    animationDurationUpdate: 600,
    animationEasing: 'cubicOut',
    animationEasingUpdate: 'cubicInOut',
    // 节点入场：从 symbolSize=0 缩放出现
    animationDelayUpdate: (idx) => idx * 5,
  }
}

/**
 * 从节点数据中提取分类列表
 */
function buildCategories(nodes) {
  const catMap = new Map()
  nodes.forEach((n) => {
    const cat = n.category || '未分类'
    if (!catMap.has(cat)) catMap.set(cat, { name: cat })
  })
  return [...catMap.values()]
}

/**
 * BFS 计算每个节点的拓扑深度（从无入边节点出发）
 */
function computeDepth(nodes, edges) {
  const inDeg = new Map(nodes.map((n) => [n.id, 0]))
  const children = new Map(nodes.map((n) => [n.id, []]))
  edges.forEach((e) => {
    if (e.type === 'depends_on') {
      inDeg.set(e.target, (inDeg.get(e.target) || 0) + 1)
      children.get(e.source)?.push(e.target)
    }
  })
  const depth = new Map()
  const queue = []
  inDeg.forEach((d, id) => { if (d === 0) { depth.set(id, 0); queue.push(id) } })
  while (queue.length) {
    const id = queue.shift()
    const d = depth.get(id) || 0
    children.get(id)?.forEach((child) => {
      if (!depth.has(child)) { depth.set(child, d + 1); queue.push(child) }
    })
  }
  // 未覆盖到的节点赋最大深度
  nodes.forEach((n) => { if (!depth.has(n.id)) depth.set(n.id, 5) })
  return depth
}

export function loadGraphToStore(store) {
  const { nodes, edges } = loadGraphData()
  store.loadData(nodes, edges)
}

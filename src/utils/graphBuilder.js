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
  const { focusNodeId, highlightedPathIds = [], traceMode = false } = state
  const highlightSet = new Set(highlightedPathIds)
  const highlightActive = highlightSet.size > 0

  // 构建 ECharts 节点
  const graphNodes = nodes.map((n) => {
    const cfg = getMaturityConfig(n.level)
    const isHighlight = highlightSet.has(n.id)
    const isFocus = n.id === focusNodeId
    const dimmed = highlightActive && !isHighlight

    return {
      id: n.id,
      name: n.name,
      symbolSize: isFocus ? cfg.symbolSize + 12 : cfg.symbolSize,
      category: n.category || 0,
      itemStyle: {
        color: cfg.nodeColor,
        borderColor: isFocus ? '#FF4444' : cfg.nodeBorderColor,
        borderWidth: isFocus ? 4 : 2,
        opacity: dimmed ? 0.25 : 1.0,
        shadowBlur: isFocus ? 20 : 0,
        shadowColor: 'rgba(255, 68, 68, 0.6)',
      },
      label: {
        show: isFocus || cfg.symbolSize >= 36,
        fontSize: isFocus ? 14 : 11,
        fontWeight: isFocus ? 'bold' : 'normal',
        color: dimmed ? '#484f58' : '#e6edf3',
        formatter: (p) => {
          if (isFocus) return `★ ${n.name}`
          return cfg.symbolSize >= 36 ? n.name : ''
        },
      },
      tooltip: {
        formatter: () => {
          const tag = getMaturityConfig(n.level).label
          return `<b>${n.name}</b><br/>${n.summary || ''}<br/><span style="color:${getMaturityConfig(n.level).color}">${tag}</span>${n.isGold ? ' 🔶金线' : ''}`
        },
      },
      // 自定义数据
      _data: n,
    }
  })

  // 构建 ECharts 边
  const graphEdges = edges.map((e) => {
    const relCfg = getRelationConfig(e.type)
    const sourceHL = highlightSet.has(e.source)
    const targetHL = highlightSet.has(e.target)
    const onPath = sourceHL && targetHL

    return {
      source: e.source,
      target: e.target,
      lineStyle: {
        color: onPath
          ? '#FF4444'
          : relCfg.lineStyle.color,
        width: onPath ? 3 : relCfg.lineStyle.width,
        type: relCfg.lineStyle.type,
        curveness: relCfg.lineStyle.curveness,
        opacity: highlightActive && !onPath ? 0.1 : 0.6,
      },
      label: {
        show: onPath,
        formatter: relCfg.label,
        fontSize: 10,
        color: '#FF4444',
      },
      _type: e.type,
    }
  })

  const categories = buildCategories(nodes)

  // 计算拓扑深度，用于入场动画延迟
  const depthMap = computeDepth(nodes, edges)

  return {
    backgroundColor: '#0d1117',
    tooltip: {
      show: true,
      trigger: 'item',
      backgroundColor: 'rgba(22,27,34,0.95)',
      borderColor: 'rgba(48,54,61,0.8)',
      textStyle: { color: '#e6edf3', fontSize: 13 },
    },
    legend: {
      show: true,
      bottom: 10,
      data: categories.map((c) => c.name),
      textStyle: { fontSize: 11, color: '#8b949e' },
      backgroundColor: 'rgba(13,17,23,0.6)',
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
    if (!catMap.has(cat)) {
      catMap.set(cat, { name: cat })
    }
  })
  return [...catMap.values()]
}

/**
 * 将节点和边加载到 graphStore
 */
export function loadGraphToStore(store) {
  const { nodes, edges } = loadGraphData()
  store.loadData(nodes, edges)
}

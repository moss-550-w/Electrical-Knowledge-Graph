/**
 * 多策略学习路径生成算法
 *
 * 策略说明：
 * - theory: 理论驱动 — 优先走电磁学、数学底层节点，再上升到工程
 * - application: 应用驱动 — 从电路/器件出发，自底向上反推
 * - control: 控制优先 — 优先信号/控制/数字链，再补功率部分
 */

// 策略偏置：调整不同策略下边的权重偏置
const STRATEGY_BIAS = {
  theory: {
    // 偏好数学、电磁学、物理类学科
    categoryBias: {
      '数学': 0.5, '电磁学': 0.5, '物理': 0.6, '电路原理': 0.7,
      '控制理论': 0.8, '信号处理': 0.9,
      '电力电子': 1.3, '电机学': 1.1,
      '储能': 1.2, '电力系统': 1.1,
    },
    relationBias: { depends_on: 0.8, maps_to: 1.3, strong_related: 1.1 },
  },
  application: {
    // 偏好电力电子、电路、器件类学科
    categoryBias: {
      '电力电子': 0.5, '模拟电子': 0.6, '数字电子': 0.7, '电路原理': 0.7,
      '电机学': 0.9, '工程基础': 0.8,
      '数学': 1.3, '物理': 1.4,
      '储能': 0.5, '电力系统': 0.7,
    },
    relationBias: { depends_on: 0.9, maps_to: 0.7, strong_related: 0.8 },
  },
  control: {
    // 偏好控制、信号、数字类学科
    categoryBias: {
      '控制理论': 0.4, '信号处理': 0.5, '数字电子': 0.6, '电机控制': 0.6,
      '数学': 0.8,
      '电力电子': 1.2, '电磁学': 1.3, '物理': 1.4,
      '储能': 0.7, '电力系统': 1.0,
    },
    relationBias: { depends_on: 0.7, maps_to: 0.8, strong_related: 0.9 },
  },
}

/**
 * Dijkstra 最短路径（带策略偏置）
 * @param {string} startId - 起点（底层基础节点）
 * @param {string} endId - 终点（目标节点）
 * @param {Map} nodeMap - 节点数据映射
 * @param {Map} adjMap - 邻接表 { nodeId -> [{target, weight, type}] }
 * @param {string} strategy - 策略名
 * @returns {{ path: string[], totalWeight: number }} 路径节点ID序列
 */
function dijkstra(startId, endId, nodeMap, adjMap, strategy) {
  const bias = STRATEGY_BIAS[strategy] || STRATEGY_BIAS.application
  const dist = new Map()
  const prev = new Map()
  const visited = new Set()
  const pq = []

  nodeMap.forEach((_, id) => {
    dist.set(id, Infinity)
    prev.set(id, null)
  })
  dist.set(startId, 0)
  pq.push({ id: startId, dist: 0 })

  while (pq.length > 0) {
    // 提取最小距离节点（简单排序实现优先队列）
    pq.sort((a, b) => a.dist - b.dist)
    const { id } = pq.shift()
    if (visited.has(id)) continue
    visited.add(id)
    if (id === endId) break

    const neighbors = adjMap.get(id) || []
    neighbors.forEach((nb) => {
      if (visited.has(nb.target)) return
      const nodeData = nodeMap.get(nb.target)
      const catBias = bias.categoryBias[nodeData?.category] || 1.0
      const relBias = bias.relationBias[nb.type] || 1.0
      const adjustedWeight = nb.weight * catBias * relBias
      const newDist = dist.get(id) + adjustedWeight
      if (newDist < dist.get(nb.target)) {
        dist.set(nb.target, newDist)
        prev.set(nb.target, id)
        pq.push({ id: nb.target, dist: newDist })
      }
    })
  }

  // 回溯路径
  const path = []
  let cur = endId
  while (cur) {
    path.unshift(cur)
    cur = prev.get(cur)
  }

  return {
    path: path.length > 1 ? path : [],
    totalWeight: dist.get(endId),
  }
}

/**
 * 生成三类学习路径
 * @param {string} targetId - 目标节点 ID
 * @param {Array} nodes - 所有节点
 * @param {Array} edges - 所有边
 * @returns {Array<{strategy: string, label: string, path: Array, nodeCount: number, difficulty: string}>}
 */
export function generatePaths(targetId, nodes, edges) {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))

  // 构建加权邻接表（双向：向上溯源依赖，向下跟踪后继）
  const adjMap = new Map()
  nodes.forEach((n) => adjMap.set(n.id, []))
  edges.forEach((e) => {
    // depends_on 方向：target 依赖 source（source → target 是向下继承）
    adjMap.get(e.source)?.push({ target: e.target, weight: e.weight, type: e.type })
    // 反向边用于溯源
    const reverseWeight = e.type === 'depends_on' ? e.weight * 0.8 : 1.2
    adjMap.get(e.target)?.push({ target: e.source, weight: reverseWeight, type: e.type })
  })

  // 找到所有底层节点（入度为0的节点，即没有 depends_on 其他节点的节点）
  const hasDependency = new Set()
  edges.filter((e) => e.type === 'depends_on').forEach((e) => hasDependency.add(e.source))
  const leafNodes = nodes.filter((n) => !hasDependency.has(n.id)).map((n) => n.id)

  // 如果没有明确的叶子节点，使用所有节点
  const startCandidates = leafNodes.length > 0 ? leafNodes : nodes.map((n) => n.id)

  const strategies = [
    { key: 'theory', label: '理论驱动路径', desc: '从电磁场、数学深扎底层原理' },
    { key: 'application', label: '应用驱动路径', desc: '从电路/器件自底向上反推' },
    { key: 'control', label: '控制优先路径', desc: '先信号/控制/数字，再补功率' },
  ]

  return strategies.map((s) => {
    // 尝试从不同起点出发，找最优路径
    let bestPath = []
    let bestWeight = Infinity

    startCandidates.forEach((startId) => {
      const result = dijkstra(startId, targetId, nodeMap, adjMap, s.key)
      if (result.path.length > 0 && result.totalWeight < bestWeight) {
        bestWeight = result.totalWeight
        bestPath = result.path
      }
    })

    // 如果找不到完整路径（可能因为边方向问题），尝试反向搜索
    if (bestPath.length === 0) {
      startCandidates.forEach((startId) => {
        const result = dijkstra(targetId, startId, nodeMap, adjMap, s.key)
        if (result.path.length > 0 && result.totalWeight < bestWeight) {
          bestWeight = result.totalWeight
          bestPath = result.path.reverse()
        }
      })
    }

    const nodeDetails = bestPath.map((id) => {
      const n = nodeMap.get(id)
      return { id, name: n?.name || id, level: n?.level || 'L1', category: n?.category || '' }
    })

    return {
      strategy: s.key,
      label: s.label,
      description: s.desc,
      path: nodeDetails,
      nodeCount: nodeDetails.length,
      difficulty: estimateDifficulty(nodeDetails),
    }
  })
}

/**
 * 预估路径难度
 */
function estimateDifficulty(nodePath) {
  const l3Count = nodePath.filter((n) => n.level === 'L3').length
  const l2Count = nodePath.filter((n) => n.level === 'L2').length
  const l1Count = nodePath.filter((n) => n.level === 'L1').length

  if (nodePath.length <= 5) return '初级'
  if (nodePath.length <= 12 && l3Count >= l1Count) return '中级'
  if (nodePath.length <= 20) return '进阶'
  return '深度'
}

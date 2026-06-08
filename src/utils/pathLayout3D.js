/**
 * 3D 路径复盘布局算法
 *
 * 轴语义：
 *   Y 轴   = 依赖深度（基础学科沉底，工程应用升顶）
 *   XZ 方位 = 学科归属（同学科同方位，路径在学科扇区间盘旋上升）
 *
 * 路径节点构成穿过学科分层的螺旋脊柱；其直接邻居作为语境节点外圈散布，
 * 体现「路径是大图中的一条线」。纯函数，不依赖 THREE，返回普通 {x,y,z}。
 */

const TWO_PI = Math.PI * 2

// 学科「基础 → 应用」次序：用于方位角分配，使相关学科在圆周上相邻
export const CATEGORY_ORDER = [
  '数学', '物理', '电磁学', '电路原理', '模拟电子', '数字电子',
  '信号处理', '控制理论', '电力电子', '电机学', '电机控制',
  '储能', '电力系统', '无线电能传输', '工程基础',
]

/**
 * 计算每个节点的「基础深度」= 最长 depends_on 前置链长度。
 * 约定：depends_on 边 source = 前置基础，target 依赖 source（叶子基础 depth=0）。
 * 记忆化 DFS + 环检测。
 * @param {Array<{source:string,target:string,type:string}>} edges
 * @returns {Map<string, number>}
 */
export function computeFoundationDepth(edges) {
  // 前置邻接表：node -> [其前置基础 id...]
  const prereq = new Map()
  const allIds = new Set()
  edges.forEach((e) => {
    allIds.add(e.source)
    allIds.add(e.target)
    if (e.type !== 'depends_on') return
    if (!prereq.has(e.target)) prereq.set(e.target, [])
    prereq.get(e.target).push(e.source)
  })

  const depth = new Map()
  const visiting = new Set() // 环检测：正在递归栈中的节点

  function dfs(id) {
    if (depth.has(id)) return depth.get(id)
    if (visiting.has(id)) return 0 // 命中环，截断
    visiting.add(id)
    let d = 0
    for (const p of prereq.get(id) || []) {
      d = Math.max(d, dfs(p) + 1)
    }
    visiting.delete(id)
    depth.set(id, d)
    return d
  }

  allIds.forEach((id) => dfs(id))
  return depth
}

/**
 * 构建 3D 路径布局。
 * @param {Array<{id,name,level,category}>} pathNodes - 学习路径节点序列
 * @param {Array} allNodes - 全图节点（取邻居完整信息）
 * @param {Array} allEdges - 全图边
 * @param {Object} [opts]
 * @returns {{
 *   nodes: Array, neighbors: Array, links: Array,
 *   levels: number[], bounds: Object, layerGap: number, radius: number
 * }}
 */
export function buildPathLayout(pathNodes, allNodes, allEdges, opts = {}) {
  const {
    radius = 6,            // 路径脊柱半径
    layerGap = 2.4,        // 每层依赖深度的高度间隔
    neighborRing = 3.0,    // 邻居相对脊柱的外扩半径
    neighborsPerNode = 3,  // 每个路径节点保留的邻居上限
  } = opts

  const nodeMap = new Map((allNodes || []).map((n) => [n.id, n]))
  const edges = allEdges || []
  const depthMap = edges.length ? computeFoundationDepth(edges) : new Map()
  const pathIds = new Set(pathNodes.map((n) => n.id))

  // 仅取路径中出现的学科，按 CATEGORY_ORDER 排序后在圆周上均分 → 用满方位、同学科同向
  const presentCats = [...new Set(pathNodes.map((n) => n.category).filter(Boolean))]
  presentCats.sort((a, b) => orderIndex(a) - orderIndex(b))
  const catAngle = new Map()
  const span = presentCats.length || 1
  presentCats.forEach((c, i) => catAngle.set(c, (i / span) * TWO_PI))

  function angleOf(cat) {
    if (catAngle.has(cat)) return catAngle.get(cat)
    // 邻居带来的、路径未涉及的学科：按其在 CATEGORY_ORDER 的相对位置兜底
    const idx = CATEGORY_ORDER.indexOf(cat)
    return idx === -1 ? 0 : (idx / CATEGORY_ORDER.length) * TWO_PI
  }
  function depthOf(id, fallback) {
    const d = depthMap.get(id)
    return d == null ? fallback : d
  }

  // ===== 路径节点 =====
  // 同一学科内多个路径节点做小角度扇开，避免重叠（仍保持学科聚簇）
  const catSeen = new Map()
  const nodes = pathNodes.map((n, idx) => {
    const depth = depthOf(n.id, idx)
    const seen = catSeen.get(n.category) || 0
    catSeen.set(n.category, seen + 1)
    const angle = angleOf(n.category) + seen * 0.16
    return {
      id: n.id,
      name: n.name,
      level: n.level,
      category: n.category || '',
      depth,
      order: idx,
      isPath: true,
      pos: {
        x: Math.cos(angle) * radius,
        y: depth * layerGap,
        z: Math.sin(angle) * radius,
      },
    }
  })

  // ===== 邻居（语境节点）=====
  // 每个路径节点取权重最高的若干直接邻居（双向、排除路径内），全局去重保留最高权
  const picked = new Map() // neighborId -> { weight, anchorId, type }
  pathNodes.forEach((pn) => {
    const cand = []
    edges.forEach((e) => {
      let other = null
      if (e.source === pn.id) other = e.target
      else if (e.target === pn.id) other = e.source
      if (!other || pathIds.has(other)) return
      cand.push({ id: other, weight: e.weight || 0.5, type: e.type })
    })
    cand.sort((a, b) => b.weight - a.weight)
    cand.slice(0, neighborsPerNode).forEach((c) => {
      const prev = picked.get(c.id)
      if (!prev || c.weight > prev.weight) {
        picked.set(c.id, { weight: c.weight, anchorId: pn.id, type: c.type })
      }
    })
  })

  const neighbors = []
  let nIdx = 0
  picked.forEach((info, id) => {
    const node = nodeMap.get(id)
    if (!node) return
    const depth = depthOf(id, 0)
    // 确定性微扰（基于序号），去重叠且重渲染稳定（不用 Math.random）
    const jA = (((nIdx * 37) % 100) / 100 - 0.5) * 0.5 // ±0.25 rad
    const jR = (((nIdx * 53) % 100) / 100) * 1.6        // 0..1.6
    nIdx++
    const angle = angleOf(node.category) + jA
    const r = radius + neighborRing + jR
    neighbors.push({
      id,
      name: node.name,
      level: node.level,
      category: node.category || '',
      depth,
      anchorId: info.anchorId,
      relType: info.type,
      isPath: false,
      pos: {
        x: Math.cos(angle) * r,
        y: depth * layerGap,
        z: Math.sin(angle) * r,
      },
    })
  })

  // 邻居 → 锚点路径节点 的连线（坐标对，供细线渲染）
  const posById = new Map()
  nodes.forEach((n) => posById.set(n.id, n.pos))
  const links = neighbors
    .map((nb) => {
      const from = posById.get(nb.anchorId)
      return from ? { from, to: nb.pos, type: nb.relType } : null
    })
    .filter(Boolean)

  // ===== 分层与包围盒 =====
  const levelSet = new Set()
  nodes.forEach((n) => levelSet.add(n.depth))
  neighbors.forEach((n) => levelSet.add(n.depth))
  const levels = [...levelSet].sort((a, b) => a - b)

  const bounds = computeBounds([...nodes, ...neighbors], radius)

  return { nodes, neighbors, links, levels, bounds, layerGap, radius }
}

function orderIndex(cat) {
  const i = CATEGORY_ORDER.indexOf(cat)
  return i === -1 ? 999 : i
}

function computeBounds(all, radius) {
  if (!all.length) {
    return { center: { x: 0, y: 0, z: 0 }, radius: radius, minY: 0, maxY: 0 }
  }
  let minX = Infinity, maxX = -Infinity
  let minY = Infinity, maxY = -Infinity
  let minZ = Infinity, maxZ = -Infinity
  all.forEach(({ pos }) => {
    minX = Math.min(minX, pos.x); maxX = Math.max(maxX, pos.x)
    minY = Math.min(minY, pos.y); maxY = Math.max(maxY, pos.y)
    minZ = Math.min(minZ, pos.z); maxZ = Math.max(maxZ, pos.z)
  })
  const center = { x: (minX + maxX) / 2, y: (minY + maxY) / 2, z: (minZ + maxZ) / 2 }
  const r = Math.max(Math.hypot(maxX - minX, maxY - minY, maxZ - minZ) / 2, radius)
  return { center, radius: r, minY, maxY }
}

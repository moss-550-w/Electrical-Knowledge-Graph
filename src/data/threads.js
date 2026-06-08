/**
 * 金线主线（thread）配置与成员计算
 *
 * 每条主线 = 从 apex 沿 depends_on 边的有向传递闭包（遍历时跳过 prune 节点）∪ extraInclude。
 * 共享基础节点（被两条线复用，如电路/数学/电力电子）会自然同时落入两条主线。
 *
 * 说明：
 * - extraInclude —— 闭包遗漏但属于本线的金线节点（仅经 strong_related 等非依赖边相连）。
 * - prune        —— 经共享节点“串味”进来的他线专属节点，遍历时剪除（不加入、不展开）。
 */
export const THREADS = {
  motor: {
    key: 'motor',
    name: '电机控制',
    apex: 'pmsm_vector_control',
    icon: '⚙️',
    color: '#409EFF',
    // 闭包覆盖 31/34，下列 3 个金线节点仅经非 depends_on 边相连，需补回
    extraInclude: ['opamp_comparator', 'fourier_analysis', 'electronics_basics'],
    prune: [],
  },
  storage: {
    key: 'storage',
    name: '储能BMS',
    apex: 'bess',
    icon: '🔋',
    color: '#67C23A',
    // bess 不依赖这些“消费型”金线节点（它们反向依赖更基础节点），闭包覆盖不到，需补回
    extraInclude: ['ekf_soc', 'kalman_filter', 'battery_charging'],
    // pcs → current_loop → pmsm_math_model 会把电机 FOC/坐标变换子树拉进来，剪除这些电机专属节点
    prune: [
      'pmsm_vector_control', 'pmsm_math_model', 'dq_transform',
      'clark_transform', 'park_transform', 'ac_motor_principles',
      'rotating_magnetic_field', 'speed_loop',
    ],
  },
  wpt: {
    key: 'wpt',
    name: '无线充电',
    apex: 'wpt_ev_charging',
    icon: '🔌',
    color: '#E6A23C',
    // Qi 标准仅经 strong_related 与 apex 相连，闭包覆盖不到，需补回
    extraInclude: ['s_qi_standard'],
    // 原边定义为单相高频全桥，依赖 s_dc_dc_full_bridge；其与 three_phase_inverter
    // 仅 maps_to（非 depends_on）相连，BFS 不展开，电机 FOC 子树天然隔离，无需剪除
    prune: [],
  },
}

/**
 * 计算某条主线的节点 id 集合
 * @param {string} threadKey - THREADS 的键（motor / storage）
 * @param {Array} edges - 全图边列表（含 type 字段）
 * @returns {Set<string>} 该主线窗口应显示的节点 id 集合
 */
export function computeThreadNodeIds(threadKey, edges) {
  const cfg = THREADS[threadKey]
  if (!cfg) return new Set()

  const prune = new Set(cfg.prune || [])

  // 构建 depends_on 邻接表：source -> [target...]
  const adj = new Map()
  edges.forEach((e) => {
    if (e.type !== 'depends_on') return
    if (!adj.has(e.source)) adj.set(e.source, [])
    adj.get(e.source).push(e.target)
  })

  // 以 apex 与 extraInclude 为种子做有向 BFS（沿 depends_on，跳过 prune）
  // extraInclude 同样展开，使其依赖的基础节点一并纳入窗口
  const result = new Set()
  const queue = []
  const seed = (id) => {
    if (prune.has(id) || result.has(id)) return
    result.add(id)
    queue.push(id)
  }
  seed(cfg.apex)
  ;(cfg.extraInclude || []).forEach(seed)

  while (queue.length) {
    const cur = queue.shift()
    const neighbors = adj.get(cur) || []
    for (const t of neighbors) {
      if (prune.has(t) || result.has(t)) continue
      result.add(t)
      queue.push(t)
    }
  }

  return result
}

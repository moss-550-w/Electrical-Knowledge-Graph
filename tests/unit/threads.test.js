import { describe, it, expect } from 'vitest'
import { computeThreadNodeIds, THREADS } from '../../src/data/threads.js'

/**
 * 针对真实 THREADS 配置（apex / extraInclude / prune）构造最小 edges，
 * 验证 depends_on 有向 BFS 闭包与剪枝逻辑。
 */
const edges = [
  // 电机线：apex 沿 depends_on 下探基础
  { source: 'pmsm_vector_control', target: 'svpwm', type: 'depends_on', weight: 1 },
  { source: 'svpwm', target: 'power_basics', type: 'depends_on', weight: 1 },
  // 储能线：apex=bess，经 pcs→current_loop 串入电机专属 pmsm_math_model（应被 prune 剔除）
  { source: 'bess', target: 'pcs', type: 'depends_on', weight: 1 },
  { source: 'pcs', target: 'current_loop', type: 'depends_on', weight: 1 },
  { source: 'current_loop', target: 'pmsm_math_model', type: 'depends_on', weight: 1 },
  { source: 'pmsm_math_model', target: 'dq_transform', type: 'depends_on', weight: 1 },
  { source: 'current_loop', target: 'power_basics', type: 'depends_on', weight: 1 },
  // 非 depends_on 边：不应参与闭包
  { source: 'pmsm_vector_control', target: 'unrelated_x', type: 'strong_related', weight: 1 },
]

describe('computeThreadNodeIds', () => {
  it('返回 Set 且含 apex 与全部 extraInclude', () => {
    const s = computeThreadNodeIds('motor', edges)
    expect(s).toBeInstanceOf(Set)
    expect(s.has(THREADS.motor.apex)).toBe(true)
    for (const id of THREADS.motor.extraInclude) {
      expect(s.has(id)).toBe(true)
    }
  })

  it('沿 depends_on 闭包纳入下游基础节点', () => {
    const s = computeThreadNodeIds('motor', edges)
    expect(s.has('svpwm')).toBe(true)
    expect(s.has('power_basics')).toBe(true)
  })

  it('非 depends_on 边不参与闭包', () => {
    const s = computeThreadNodeIds('motor', edges)
    expect(s.has('unrelated_x')).toBe(false)
  })

  it('prune 节点被剔除，且不再向下展开', () => {
    const s = computeThreadNodeIds('storage', edges)
    expect(s.has('bess')).toBe(true)
    expect(s.has('pcs')).toBe(true)
    // pmsm_math_model 在 storage.prune 中 → 剔除
    expect(THREADS.storage.prune).toContain('pmsm_math_model')
    expect(s.has('pmsm_math_model')).toBe(false)
    // 被 prune 节点不展开 → 其专属下游 dq_transform 不应进入
    expect(s.has('dq_transform')).toBe(false)
  })

  it('共享基础节点同时落入电机线与储能线', () => {
    const motor = computeThreadNodeIds('motor', edges)
    const storage = computeThreadNodeIds('storage', edges)
    expect(motor.has('power_basics')).toBe(true)
    expect(storage.has('power_basics')).toBe(true)
  })

  it('未知 threadKey 返回空 Set', () => {
    const s = computeThreadNodeIds('__nope__', edges)
    expect(s).toBeInstanceOf(Set)
    expect(s.size).toBe(0)
  })
})

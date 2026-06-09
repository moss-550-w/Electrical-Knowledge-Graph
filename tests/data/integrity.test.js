import { describe, it, expect } from 'vitest'
import gold from '../../src/data/goldThread.json'
import skeleton from '../../src/data/skeletonGraph.json'

const ALL = [...gold, ...skeleton]
const VALID_LEVELS = new Set(['L1', 'L2', 'L3'])
const VALID_REL_TYPES = new Set(['depends_on', 'strong_related', 'maps_to', 'suggest_sync'])
const idSet = new Set(ALL.map((n) => n.id))

describe('数据规模下界（软断言，避免内容增删即脆断）', () => {
  it('金线节点 ≥ 30，无 L1 混入，主体为 L3（含少量 L2 数学/物理底座）', () => {
    expect(gold.length).toBeGreaterThanOrEqual(30)
    // 金线文件不应混入 L1 骨架节点
    expect(gold.some((n) => n.level === 'L1')).toBe(false)
    // 绝大多数为 L3（当前 60 个中 58 个 L3，2 个 L2 底座节点）
    const l3 = gold.filter((n) => n.level === 'L3').length
    expect(l3).toBeGreaterThanOrEqual(30)
    expect(l3 / gold.length).toBeGreaterThan(0.9)
  })

  it('骨架节点 ≥ 40 且全部 L2（已无 L1 残留）', () => {
    expect(skeleton.length).toBeGreaterThanOrEqual(40)
    expect(skeleton.every((n) => n.level === 'L2')).toBe(true)
    expect(skeleton.some((n) => n.level === 'L1')).toBe(false)
  })
})

describe('节点字段完整性', () => {
  it('所有节点含 id/name/level，且 level 合法', () => {
    for (const n of ALL) {
      expect(typeof n.id).toBe('string')
      expect(n.id.length).toBeGreaterThan(0)
      expect(typeof n.name).toBe('string')
      expect(VALID_LEVELS.has(n.level)).toBe(true)
    }
  })

  it('节点 id 全局唯一（跨金线/骨架无碰撞）', () => {
    expect(idSet.size).toBe(ALL.length)
  })
})

describe('关系（边）完整性', () => {
  it('所有 relation 的 type 合法、weight 为数字', () => {
    for (const n of ALL) {
      for (const r of n.relations || []) {
        expect(VALID_REL_TYPES.has(r.type)).toBe(true)
        expect(typeof r.weight).toBe('number')
        expect(Number.isFinite(r.weight)).toBe(true)
      }
    }
  })

  it('无悬空边：每条 relation 的 target 必存在于节点集合', () => {
    const dangling = []
    for (const n of ALL) {
      for (const r of n.relations || []) {
        if (!idSet.has(r.target)) dangling.push(`${n.id} -> ${r.target}`)
      }
    }
    expect(dangling).toEqual([])
  })
})

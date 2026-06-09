import { describe, it, expect } from 'vitest'
import { generatePaths } from '../../src/utils/pathAlgorithm.js'
import { miniNodes, miniEdges } from '../fixtures/miniGraph.js'

const DIFFICULTIES = ['初级', '中级', '进阶', '深度']
const STRATEGIES = ['theory', 'application', 'control']

describe('generatePaths 结构契约', () => {
  const result = generatePaths('motor_ctrl', miniNodes, miniEdges)

  it('恒返回三条策略，顺序为 theory/application/control', () => {
    expect(result).toHaveLength(3)
    expect(result.map((r) => r.strategy)).toEqual(STRATEGIES)
  })

  it('每条结果字段齐备且 nodeCount === path.length', () => {
    for (const r of result) {
      expect(r).toMatchObject({
        strategy: expect.any(String),
        label: expect.any(String),
        description: expect.any(String),
        path: expect.any(Array),
      })
      expect(r.nodeCount).toBe(r.path.length)
      expect(DIFFICULTIES).toContain(r.difficulty)
    }
  })

  it('连通 target 的路径非空且包含目标节点', () => {
    for (const r of result) {
      expect(r.path.length).toBeGreaterThan(1)
      expect(r.path.map((n) => n.id)).toContain('motor_ctrl')
    }
  })

  it('路径节点补全了 name/level/category', () => {
    const node = result[0].path[0]
    expect(node).toHaveProperty('name')
    expect(node).toHaveProperty('level')
    expect(node).toHaveProperty('category')
  })
})

describe('generatePaths 边界', () => {
  it('孤立 target（无边连通）→ 空路径、nodeCount 0、难度初级', () => {
    const r = generatePaths('device_iso', miniNodes, miniEdges)
    expect(r.map((p) => p.nodeCount)).toEqual([0, 0, 0])
    expect(r.map((p) => p.difficulty)).toEqual(['初级', '初级', '初级'])
  })

  it('纯线性链 a→b（target=唯一叶子的下游）：起点候选退化，返回空路径', () => {
    // 算法以「无 depends_on 出边的叶子」为起点候选；纯链中仅 b 无出边，
    // 但 b 即 target，dijkstra(b,b) 不成路径 → 三策略均空。这是退化分支的真实语义。
    const nodes = [
      { id: 'a', name: 'A', level: 'L1', category: '数学' },
      { id: 'b', name: 'B', level: 'L3', category: '电机控制' },
    ]
    const edges = [{ source: 'a', target: 'b', type: 'depends_on', weight: 1 }]
    const r = generatePaths('b', nodes, edges)
    expect(r.map((p) => p.nodeCount)).toEqual([0, 0, 0])
  })

  it('含旁路叶子的连通图：能生成抵达 target 的非空路径', () => {
    // 叶子候选 = 无 depends_on 出边者 = {b, c}；从旁路叶子 c 经双向邻接
    // c→a→b 可抵达 target=b，于是路径非空。
    const nodes = [
      { id: 'a', name: 'A', level: 'L1', category: '数学' },
      { id: 'b', name: 'B', level: 'L3', category: '电机控制' },
      { id: 'c', name: 'C', level: 'L2', category: '电路原理' },
    ]
    const edges = [
      { source: 'a', target: 'b', type: 'depends_on', weight: 1 },
      { source: 'a', target: 'c', type: 'depends_on', weight: 1 },
    ]
    const r = generatePaths('b', nodes, edges)
    for (const p of r) {
      expect(p.path.length).toBeGreaterThan(1)
      expect(p.path.map((n) => n.id)).toContain('b')
      expect(p.difficulty).toBe('初级')
    }
  })
})

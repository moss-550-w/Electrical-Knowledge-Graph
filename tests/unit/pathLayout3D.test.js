import { describe, it, expect } from 'vitest'
import { computeFoundationDepth, buildPathLayout } from '../../src/utils/pathLayout3D.js'
import { miniNodes, miniEdges, chainEdges } from '../fixtures/miniGraph.js'

describe('computeFoundationDepth', () => {
  it('线性链 A→B→C：depth 0/1/2（source 为前置基础）', () => {
    const d = computeFoundationDepth(chainEdges)
    expect(d.get('A')).toBe(0)
    expect(d.get('B')).toBe(1)
    expect(d.get('C')).toBe(2)
  })

  it('多入边取最长前置链', () => {
    // C 依赖 A（链长1）与 B；B 依赖 A → B depth 1, C 应取 max(A+1, B+1)=2
    const edges = [
      { source: 'A', target: 'B', type: 'depends_on', weight: 1 },
      { source: 'A', target: 'C', type: 'depends_on', weight: 1 },
      { source: 'B', target: 'C', type: 'depends_on', weight: 1 },
    ]
    const d = computeFoundationDepth(edges)
    expect(d.get('C')).toBe(2)
  })

  it('环依赖不死循环且返回有限值', () => {
    const edges = [
      { source: 'A', target: 'B', type: 'depends_on', weight: 1 },
      { source: 'B', target: 'A', type: 'depends_on', weight: 1 },
    ]
    const d = computeFoundationDepth(edges)
    expect(Number.isFinite(d.get('A'))).toBe(true)
    expect(Number.isFinite(d.get('B'))).toBe(true)
  })

  it('非 depends_on 边不贡献深度', () => {
    const edges = [{ source: 'A', target: 'B', type: 'strong_related', weight: 1 }]
    const d = computeFoundationDepth(edges)
    expect(d.get('B')).toBe(0)
  })
})

describe('buildPathLayout', () => {
  const pathNodes = [
    { id: 'math', name: '数学基础', level: 'L1', category: '数学' },
    { id: 'circuit', name: '电路原理', level: 'L2', category: '电路原理' },
    { id: 'motor_ctrl', name: '电机矢量控制', level: 'L3', category: '电机控制' },
  ]
  const layout = buildPathLayout(pathNodes, miniNodes, miniEdges)

  it('返回完整结构键', () => {
    for (const k of ['nodes', 'neighbors', 'links', 'levels', 'bounds', 'layerGap', 'radius']) {
      expect(layout).toHaveProperty(k)
    }
  })

  it('脊柱节点数等于路径长度，且每点 pos 含数值 x/y/z', () => {
    expect(layout.nodes).toHaveLength(pathNodes.length)
    for (const n of layout.nodes) {
      expect(typeof n.pos.x).toBe('number')
      expect(typeof n.pos.y).toBe('number')
      expect(typeof n.pos.z).toBe('number')
    }
  })

  it('bounds 含 center 与数值 radius', () => {
    expect(layout.bounds).toHaveProperty('center')
    expect(layout.bounds.center).toMatchObject({
      x: expect.any(Number),
      y: expect.any(Number),
      z: expect.any(Number),
    })
    expect(typeof layout.radius).toBe('number')
  })

  it('依赖深度映射到 Y 轴（math 深度0 在 circuit 之下）', () => {
    const byId = Object.fromEntries(layout.nodes.map((n) => [n.id, n]))
    expect(byId.math.pos.y).toBeLessThan(byId.circuit.pos.y)
  })
})

import { describe, it, expect } from 'vitest'
import { encodePath, decodePath, rehydratePath } from '../../src/utils/pathShare.js'
import { miniNodes } from '../fixtures/miniGraph.js'

describe('encodePath / decodePath 往返', () => {
  it('path 入参编解码后 i 数组等于原 id 序列', () => {
    const p = {
      name: '我的路径',
      strategy: 'theory',
      label: '理论驱动路径',
      path: [{ id: 'math' }, { id: 'circuit' }, { id: 'motor_ctrl' }],
    }
    const decoded = decodePath(encodePath(p))
    expect(decoded.i).toEqual(['math', 'circuit', 'motor_ctrl'])
    expect(decoded.n).toBe('我的路径')
    expect(decoded.s).toBe('theory')
    expect(decoded.l).toBe('理论驱动路径')
  })

  it('支持 nodeIds 入参', () => {
    const decoded = decodePath(encodePath({ name: 'x', nodeIds: ['a', 'b'] }))
    expect(decoded.i).toEqual(['a', 'b'])
  })

  it('含中文/unicode 名称往返无损', () => {
    const decoded = decodePath(encodePath({ name: '永磁同步电机⚙️', nodeIds: ['n1'] }))
    expect(decoded.n).toBe('永磁同步电机⚙️')
  })

  it('path 项可为字符串 id 或 {id}', () => {
    const decoded = decodePath(encodePath({ name: 'm', path: ['a', { id: 'b' }] }))
    expect(decoded.i).toEqual(['a', 'b'])
  })
})

describe('decodePath 容错', () => {
  it('非法 base64 返回 null', () => {
    expect(decodePath('!!!not-base64!!!')).toBeNull()
  })

  it('空 i 数组返回 null', () => {
    expect(decodePath(encodePath({ name: 'empty', nodeIds: [] }))).toBeNull()
  })
})

describe('rehydratePath', () => {
  it('仅保留命中真实节点的 id，并补全 name/level/category', () => {
    const meta = { i: ['math', 'circuit', '__ghost__'], n: '导入', s: 'theory', l: '标签' }
    const r = rehydratePath(meta, miniNodes)
    expect(r.path.map((n) => n.id)).toEqual(['math', 'circuit'])
    expect(r.nodeCount).toBe(2)
    expect(r.name).toBe('导入')
    expect(r.strategy).toBe('theory')
    expect(r.path[0]).toMatchObject({ id: 'math', name: '数学基础', level: 'L1' })
  })

  it('全不命中返回 null', () => {
    expect(rehydratePath({ i: ['x', 'y'] }, miniNodes)).toBeNull()
  })

  it('空 ids 返回 null', () => {
    expect(rehydratePath({ i: [] }, miniNodes)).toBeNull()
  })

  it('兼容 nodeIds/name 风格 meta', () => {
    const r = rehydratePath({ nodeIds: ['math'], name: '别名' }, miniNodes)
    expect(r.name).toBe('别名')
    expect(r.path).toHaveLength(1)
  })
})

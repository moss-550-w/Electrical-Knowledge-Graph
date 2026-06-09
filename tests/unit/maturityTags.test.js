import { describe, it, expect } from 'vitest'
import {
  getMaturityConfig,
  getRelationConfig,
  MATURITY_CONFIG,
  RELATION_CONFIG,
} from '../../src/utils/maturityTags.js'

describe('getMaturityConfig', () => {
  it.each(['L1', 'L2', 'L3'])('返回 %s 对应配置且含关键字段', (level) => {
    const c = getMaturityConfig(level)
    expect(c).toBe(MATURITY_CONFIG[level])
    expect(c).toHaveProperty('label')
    expect(c).toHaveProperty('color')
    expect(c).toHaveProperty('symbolSize')
  })

  it('未知 level 回退到 L1', () => {
    expect(getMaturityConfig('X')).toBe(MATURITY_CONFIG.L1)
    expect(getMaturityConfig(undefined)).toBe(MATURITY_CONFIG.L1)
  })

  it('成熟度越高节点尺寸越大（L3 > L2 > L1）', () => {
    expect(MATURITY_CONFIG.L3.symbolSize).toBeGreaterThan(MATURITY_CONFIG.L2.symbolSize)
    expect(MATURITY_CONFIG.L2.symbolSize).toBeGreaterThan(MATURITY_CONFIG.L1.symbolSize)
  })
})

describe('getRelationConfig', () => {
  it.each(['depends_on', 'strong_related', 'maps_to', 'suggest_sync'])(
    '返回 %s 对应配置且含 lineStyle',
    (type) => {
      const c = getRelationConfig(type)
      expect(c).toBe(RELATION_CONFIG[type])
      expect(c).toHaveProperty('label')
      expect(c.lineStyle).toHaveProperty('color')
    },
  )

  it('未知 type 回退到 strong_related', () => {
    expect(getRelationConfig('unknown')).toBe(RELATION_CONFIG.strong_related)
    expect(getRelationConfig(undefined)).toBe(RELATION_CONFIG.strong_related)
  })

  it('仅 depends_on 与 maps_to 带箭头', () => {
    expect(RELATION_CONFIG.depends_on.arrow).toBe(true)
    expect(RELATION_CONFIG.maps_to.arrow).toBe(true)
    expect(RELATION_CONFIG.strong_related.arrow).toBe(false)
    expect(RELATION_CONFIG.suggest_sync.arrow).toBe(false)
  })
})

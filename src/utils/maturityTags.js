/**
 * L1/L2/L3 成熟度标签配置
 * L3 = 完备（金色），L2 = 核心（蓝色），L1 = 骨架（灰色）
 */
export const MATURITY_CONFIG = {
  L3: {
    label: 'L3·完备',
    color: '#E6A817',
    bgColor: 'rgba(230, 168, 23, 0.15)',
    nodeColor: '#F5C842',
    nodeBorderColor: '#C4900A',
    symbolSize: 48,
    description: '含详细公式、图解、动图与跨学科关联',
  },
  L2: {
    label: 'L2·核心',
    color: '#409EFF',
    bgColor: 'rgba(64, 158, 255, 0.12)',
    nodeColor: '#6DB8FF',
    nodeBorderColor: '#2B7BD6',
    symbolSize: 36,
    description: '有完整文字说明与关键公式',
  },
  L1: {
    label: 'L1·骨架',
    color: '#909399',
    bgColor: 'rgba(144, 147, 153, 0.10)',
    nodeColor: '#B0B3B8',
    nodeBorderColor: '#707378',
    symbolSize: 28,
    description: '仅含标题与基本关联',
  },
}

/**
 * 语义关系类型配置
 */
export const RELATION_CONFIG = {
  depends_on: {
    label: '前置依赖',
    lineStyle: { color: '#E83333', width: 2, type: 'solid', curveness: 0.2 },
    arrow: true,
  },
  strong_related: {
    label: '强关联',
    lineStyle: { color: '#409EFF', width: 1.5, type: 'solid', curveness: 0.2 },
    arrow: false,
  },
  maps_to: {
    label: '工程映射',
    lineStyle: { color: '#67C23A', width: 1.5, type: 'dashed', curveness: 0.25 },
    arrow: true,
  },
  suggest_sync: {
    label: '建议同步',
    lineStyle: { color: '#E6A817', width: 1, type: 'dotted', curveness: 0.25 },
    arrow: false,
  },
}

export function getMaturityConfig(level) {
  return MATURITY_CONFIG[level] || MATURITY_CONFIG.L1
}

export function getRelationConfig(type) {
  return RELATION_CONFIG[type] || RELATION_CONFIG.strong_related
}

/**
 * 单元测试用迷你知识图（手写，与真实数据解耦）
 *
 * 约定（与 src 实现一致）：depends_on 边 source = 前置基础，target 依赖 source。
 * 节点带 category 以驱动 pathAlgorithm 的策略偏置；含多学科、混合边类型，
 * 并刻意保留一个孤立节点 device_iso 用于测「不连通 target」。
 */

export const miniNodes = [
  { id: 'math', name: '数学基础', level: 'L1', category: '数学' },
  { id: 'circuit', name: '电路原理', level: 'L2', category: '电路原理' },
  { id: 'analog', name: '模拟电子', level: 'L2', category: '模拟电子' },
  { id: 'digital', name: '数字电子', level: 'L2', category: '数字电子' },
  { id: 'power', name: '电力电子基础', level: 'L2', category: '电力电子' },
  { id: 'control', name: '控制理论', level: 'L2', category: '控制理论' },
  { id: 'signal', name: '信号处理', level: 'L2', category: '信号处理' },
  { id: 'motor_ctrl', name: '电机矢量控制', level: 'L3', category: '电机控制' },
  { id: 'grid', name: '并网系统', level: 'L3', category: '电力系统' },
  { id: 'device_iso', name: '孤立器件', level: 'L1', category: '数字电子' },
]

// depends_on：source 为前置基础；另含一条 strong_related、一条 maps_to 验证类型过滤
export const miniEdges = [
  { source: 'math', target: 'circuit', type: 'depends_on', weight: 1.0 },
  { source: 'circuit', target: 'analog', type: 'depends_on', weight: 0.9 },
  { source: 'circuit', target: 'power', type: 'depends_on', weight: 0.9 },
  { source: 'circuit', target: 'digital', type: 'depends_on', weight: 0.8 },
  { source: 'analog', target: 'control', type: 'depends_on', weight: 0.7 },
  { source: 'digital', target: 'signal', type: 'depends_on', weight: 0.7 },
  { source: 'signal', target: 'control', type: 'depends_on', weight: 0.6 },
  { source: 'power', target: 'motor_ctrl', type: 'depends_on', weight: 1.0 },
  { source: 'control', target: 'motor_ctrl', type: 'depends_on', weight: 0.9 },
  { source: 'power', target: 'grid', type: 'depends_on', weight: 0.8 },
  { source: 'motor_ctrl', target: 'grid', type: 'strong_related', weight: 0.5 },
  { source: 'control', target: 'signal', type: 'maps_to', weight: 0.4 },
]

/** 一条已知的线性 depends_on 链，用于 computeFoundationDepth 精确断言 */
export const chainEdges = [
  { source: 'A', target: 'B', type: 'depends_on', weight: 1 },
  { source: 'B', target: 'C', type: 'depends_on', weight: 1 },
]

// 临时校验脚本：验证 WPT 金线节点 JSON 合法性、公式对齐、主线闭包正确性
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const gold = JSON.parse(fs.readFileSync(path.join(root, 'src/data/goldThread.json'), 'utf8'))
const skel = JSON.parse(fs.readFileSync(path.join(root, 'src/data/skeletonGraph.json'), 'utf8'))

console.log('=== JSON 解析 ===')
console.log('goldThread 节点数:', gold.length)
console.log('skeletonGraph 节点数:', skel.length)

console.log('\n=== WPT 金线节点公式对齐 ===')
const wpt = gold.filter((n) => n.category === '无线电能传输')
console.log('WPT 金线节点:', wpt.map((n) => n.id).join(', '))
wpt.forEach((n) => {
  const f = (n.detail.formulas || []).length
  const s = (n.detail.formulas_steps || []).length
  const ok = s <= f
  console.log(`  ${n.id}: formulas=${f} steps组=${s} ${ok ? '✓对齐' : '✗错位'}`)
})

console.log('\n=== 引用完整性（relations.target 是否都存在）===')
const allIds = new Set([...gold, ...skel].map((n) => n.id))
let dangling = 0
;[...gold, ...skel].forEach((n) => {
  ;(n.relations || []).forEach((r) => {
    if (!allIds.has(r.target)) {
      console.log(`  ✗ 悬挂边: ${n.id} -> ${r.target}`)
      dangling++
    }
  })
})
console.log(dangling === 0 ? '  ✓ 无悬挂边' : `  ✗ 共 ${dangling} 条悬挂边`)

console.log('\n=== 新增骨架节点 ===')
;['s_resonant_circuit', 's_qi_standard'].forEach((id) => {
  const node = skel.find((n) => n.id === id)
  console.log(`  ${id}: ${node ? '✓存在 (' + node.name + ')' : '✗缺失'}`)
})

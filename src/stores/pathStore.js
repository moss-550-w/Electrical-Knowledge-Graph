import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const LS_PATHS = 'ee-kg-paths'

export const usePathStore = defineStore('path', () => {
  // [{ id, name, strategy, label, difficulty, nodeIds, createdAt }]
  const savedPaths = ref(JSON.parse(localStorage.getItem(LS_PATHS) || '[]'))

  watch(savedPaths, (v) => localStorage.setItem(LS_PATHS, JSON.stringify(v)), { deep: true })

  function genId() {
    return 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36)
  }

  /** 路径的去重指纹：策略 + 节点序列 */
  function fingerprint(nodeIds, strategy = '') {
    return strategy + '|' + nodeIds.join(',')
  }

  /**
   * 是否已存在相同路径（按策略+节点序列）
   * @param {{strategy?:string, path?:Array, nodeIds?:Array}} p
   */
  function exists(p) {
    const ids = p.nodeIds || (p.path || []).map((n) => n.id)
    const fp = fingerprint(ids, p.strategy || '')
    return savedPaths.value.some((s) => fingerprint(s.nodeIds, s.strategy) === fp)
  }

  /**
   * 保存一条路径
   * @param {{strategy,label,difficulty,path?:Array,nodeIds?:Array}} p
   * @param {string} name
   * @returns {object} 新建记录
   */
  function savePath(p, name) {
    const nodeIds = p.nodeIds || (p.path || []).map((n) => n.id)
    const rec = {
      id: genId(),
      name: name || p.label || '未命名路径',
      strategy: p.strategy || '',
      label: p.label || '',
      difficulty: p.difficulty || '',
      nodeIds,
      createdAt: Date.now(),
    }
    savedPaths.value.unshift(rec)
    return rec
  }

  function renamePath(id, name) {
    const rec = savedPaths.value.find((s) => s.id === id)
    if (rec) rec.name = name
  }

  function removePath(id) {
    const idx = savedPaths.value.findIndex((s) => s.id === id)
    if (idx !== -1) savedPaths.value.splice(idx, 1)
  }

  function clearAll() {
    savedPaths.value = []
  }

  return { savedPaths, exists, savePath, renamePath, removePath, clearAll }
})

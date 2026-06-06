import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const LS_HISTORY = 'ee-kg-history'
const LS_VIEWPORT = 'ee-kg-viewport'

export const useHistoryStore = defineStore('history', () => {
  // [{ id, name, category, level, visitedAt }]
  const history = ref(JSON.parse(localStorage.getItem(LS_HISTORY) || '[]'))
  const visitedIds = ref(new Set(history.value.map((h) => h.id)))

  // 视角快照 { zoom, center }
  const savedViewport = ref(JSON.parse(localStorage.getItem(LS_VIEWPORT) || 'null'))

  watch(history, (v) => localStorage.setItem(LS_HISTORY, JSON.stringify(v)), { deep: true })

  function recordVisit(node) {
    visitedIds.value.add(node.id)
    // 去重后前插
    const idx = history.value.findIndex((h) => h.id === node.id)
    if (idx !== -1) history.value.splice(idx, 1)
    history.value.unshift({
      id: node.id,
      name: node.name,
      category: node.category,
      level: node.level,
      visitedAt: Date.now(),
    })
    if (history.value.length > 50) history.value.length = 50
  }

  function saveViewport(zoom, center) {
    savedViewport.value = { zoom, center }
    localStorage.setItem(LS_VIEWPORT, JSON.stringify({ zoom, center }))
  }

  function clearHistory() {
    history.value = []
    visitedIds.value = new Set()
    localStorage.removeItem(LS_HISTORY)
  }

  return { history, visitedIds, savedViewport, recordVisit, saveViewport, clearHistory }
})

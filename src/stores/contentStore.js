import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useGraphStore } from './graphStore'

export const useContentStore = defineStore('content', () => {
  const detailCache = ref(new Map())

  /**
   * 按需加载节点详情
   * 优先级：内存缓存 → graphStore 内联 detail → 独立 JSON 文件
   */
  async function loadDetail(nodeId) {
    if (detailCache.value.has(nodeId)) {
      return detailCache.value.get(nodeId)
    }

    // L3 节点 detail 已内联在 goldThread.json 中
    const graphStore = useGraphStore()
    const node = graphStore.nodes.find((n) => n.id === nodeId)
    if (node?.detail) {
      detailCache.value.set(nodeId, node.detail)
      return node.detail
    }

    // 降级：尝试独立 JSON 文件（扩展用）
    try {
      const mod = await import(`@/data/details/${nodeId}.json`)
      const detail = mod.default || mod
      detailCache.value.set(nodeId, detail)
      return detail
    } catch {
      return null
    }
  }

  return { detailCache, loadDetail }
})

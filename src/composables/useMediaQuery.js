import { ref } from 'vue'

/**
 * 响应式媒体查询。返回随窗口变化自动更新的 matches ref。
 * 监听器随应用生命周期常驻（用于下方共享单例），无需手动解绑。
 * @param {string} query - 媒体查询字符串，如 '(max-width: 768px)'
 * @returns {import('vue').Ref<boolean>}
 */
export function useMediaQuery(query) {
  const matches = ref(false)
  if (typeof window !== 'undefined' && window.matchMedia) {
    const mql = window.matchMedia(query)
    matches.value = mql.matches
    mql.addEventListener('change', (e) => { matches.value = e.matches })
  }
  return matches
}

// 共享单例：移动端断点（768px），全应用复用同一 ref 与监听器
const isMobile = useMediaQuery('(max-width: 768px)')

export function useIsMobile() {
  return isMobile
}

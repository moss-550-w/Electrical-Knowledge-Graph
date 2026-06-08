<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { useGraphStore } from '@/stores/graphStore'

const graphStore = useGraphStore()

const query = ref('')
const showDropdown = ref(false)
const searchRef = ref(null)

const searchResults = computed(() => {
  if (!query.value.trim()) return []
  const q = query.value.trim().toLowerCase()
  return graphStore.visibleNodes
    .filter((n) => {
      const matchName = n.name.toLowerCase().includes(q)
      const matchId = n.id.toLowerCase().includes(q)
      const matchSummary = n.summary?.toLowerCase().includes(q)
      return matchName || matchId || matchSummary
    })
    .slice(0, 8)
})

function selectNode(nodeId) {
  graphStore.setFocusNode(nodeId)
  query.value = ''
  showDropdown.value = false
  // 触发图谱定位
  if (graphStore.graphInstance) {
    graphStore.graphInstance.dispatchAction({
      type: 'roam',
      zoom: 1.5,
    })
  }
}

function handleInput() {
  showDropdown.value = query.value.trim().length > 0
}

function handleBlur() {
  // 延迟关闭，让点击事件触发
  setTimeout(() => { showDropdown.value = false }, 200)
}

onMounted(() => {
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault()
      searchRef.value?.focus()
    }
  })
})
</script>

<template>
  <div class="search-bar" ref="searchRef">
    <el-input
      v-model="query"
      placeholder="搜索知识点（Ctrl+K）…"
      :prefix-icon="Search"
      clearable
      @input="handleInput"
      @focus="handleInput"
      @blur="handleBlur"
      size="large"
      class="search-input"
    />
    <div v-if="showDropdown && searchResults.length > 0" class="search-dropdown">
      <div
        v-for="node in searchResults"
        :key="node.id"
        class="search-item"
        @mousedown.prevent="selectNode(node.id)"
      >
        <span class="search-item-name">{{ node.name }}</span>
        <span
          class="search-item-level"
          :style="{ color: node.level === 'L3' ? '#E6A817' : node.level === 'L2' ? '#409EFF' : '#909399' }"
        >{{ node.level }}</span>
      </div>
    </div>
    <div v-if="showDropdown && query && searchResults.length === 0" class="search-dropdown">
      <div class="search-item search-empty">未找到匹配节点</div>
    </div>
  </div>
</template>

<style scoped>
.search-bar {
  position: relative;
  width: 360px;
  z-index: 100;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 24px;
  background: rgba(22, 27, 34, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border);
  box-shadow: 0 2px 12px rgba(0,0,0,0.3);
}

.search-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0; right: 0;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.4);
  overflow: hidden; max-height: 360px; overflow-y: auto;
}

.search-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 16px; cursor: pointer; transition: background 0.15s;
}
.search-item:hover { background: var(--glow-blue); }
.search-item-name { font-size: 14px; color: var(--text-primary); }
.search-item-level { font-size: 12px; font-weight: 500; }
.search-empty { color: var(--text-muted); cursor: default; justify-content: center; }
</style>

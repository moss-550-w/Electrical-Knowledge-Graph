<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useGraphStore } from '@/stores/graphStore'
import { usePathStore } from '@/stores/pathStore'
import { useIsMobile } from '@/composables/useMediaQuery'
import GraphCanvas from '@/components/GraphCanvas.vue'
import SearchBar from '@/components/SearchBar.vue'
import TopbarControls from '@/components/TopbarControls.vue'
import ContextPanel from '@/components/ContextPanel.vue'
import DetailOverlay from '@/components/DetailOverlay.vue'
import PathPlanner from '@/components/PathPlanner.vue'
import SavedPaths from '@/components/SavedPaths.vue'
import TourGuide from '@/components/TourGuide.vue'
import { decodePath, rehydratePath } from '@/utils/pathShare'

const router = useRouter()
const route = useRoute()
const graphStore = useGraphStore()
const pathStore = usePathStore()
const isMobile = useIsMobile()

const tourVisible = ref(false)
const drawerVisible = ref(false)
const detailNodeId = ref('')
const detailVisible = ref(false)
const plannerVisible = ref(false)
const savedPathsVisible = ref(false)
const mobileMenuOpen = ref(false)

// 节点聚焦时自动打开面板
watch(() => graphStore.focusNodeId, (id) => {
  drawerVisible.value = !!id
})

// 分享链接导入：等图谱数据就绪后处理（nodes 有数据才能 rehydrate）
watch(() => graphStore.nodes.length, (len) => {
  if (len === 0) return
  const encoded = route.query.p
  if (!encoded) return
  const meta = decodePath(decodeURIComponent(encoded))
  if (!meta) { ElMessage.warning('分享链接无效'); router.replace({ query: {} }); return }
  const full = rehydratePath(meta, graphStore.nodes)
  if (!full) { ElMessage.warning('路径节点不存在于当前图谱'); router.replace({ query: {} }); return }
  if (!pathStore.exists(meta)) pathStore.savePath(full, meta.n || full.name)
  graphStore.clearFocus()
  graphStore.highlightedPathIds = [...meta.i]
  ElMessage.success(`已导入分享路径：${meta.n || full.name}`)
  router.replace({ query: {} })
}, { once: true })

function openDetail(nodeId) {
  detailNodeId.value = nodeId
  detailVisible.value = true
}

function handleNavigate(nodeId) {
  detailNodeId.value = nodeId
}

function openPlanner() {
  plannerVisible.value = true
}

function goToReview() {
  plannerVisible.value = false
  router.push('/review')
}
</script>

<template>
  <div class="app-layout">
    <header class="topbar">
      <div class="topbar-left">
        <span class="logo">
          <span class="logo-icon">⚡</span>
          <span class="logo-text">电气知识图谱</span>
        </span>
      </div>
      <SearchBar />
      <!-- 桌面：控件横排 -->
      <TopbarControls
        v-if="!isMobile"
        :panel-open="drawerVisible"
        @open-planner="openPlanner"
        @open-saved="savedPathsVisible = true"
        @open-tour="tourVisible = true"
        @toggle-panel="drawerVisible = !drawerVisible"
      />
      <!-- 移动：汉堡按钮 → 抽屉 -->
      <button v-else class="hamburger" aria-label="菜单" @click="mobileMenuOpen = true">☰</button>
    </header>

    <!-- 移动端控件抽屉 -->
    <el-drawer
      v-if="isMobile"
      v-model="mobileMenuOpen"
      direction="rtl"
      size="300px"
      title="菜单"
      class="mobile-menu-drawer"
    >
      <TopbarControls
        stacked
        :panel-open="drawerVisible"
        @open-planner="openPlanner"
        @open-saved="savedPathsVisible = true"
        @open-tour="tourVisible = true"
        @toggle-panel="drawerVisible = !drawerVisible"
        @close="mobileMenuOpen = false"
      />
    </el-drawer>

    <main class="main-area">
      <GraphCanvas />
    </main>

    <!-- 右侧面板：用 transition 替代 el-drawer，从图谱右侧飞入 -->
    <transition name="panel-slide">
      <div v-if="drawerVisible" class="side-panel">
        <button class="panel-close" @click="drawerVisible = false; graphStore.clearFocus()">×</button>
        <ContextPanel
          @open-detail="openDetail"
          @open-planner="openPlanner"
        />
      </div>
    </transition>

    <DetailOverlay
      :node-id="detailNodeId"
      :visible="detailVisible"
      @close="detailVisible = false"
      @navigate="handleNavigate"
    />

    <PathPlanner
      :visible="plannerVisible"
      @close="plannerVisible = false"
      @go-review="goToReview"
    />

    <TourGuide :visible="tourVisible" @close="tourVisible = false" />

    <SavedPaths :visible="savedPathsVisible" @close="savedPathsVisible = false" />
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-primary);
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  background: var(--bg-surface);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border);
  z-index: 50;
  gap: 16px;
  flex-shrink: 0;
}

.topbar-left { display: flex; align-items: center; flex-shrink: 0; }

.logo {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 18px;
  font-weight: 700;
  white-space: nowrap;
}
.logo-icon { font-size: 20px; }
.logo-text {
  background: linear-gradient(90deg, #409EFF, #E6A817);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 移动端汉堡按钮 */
.hamburger {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 36px;
  font-size: 20px;
  line-height: 1;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-card);
  color: var(--text-primary);
  cursor: pointer;
  transition: background 0.15s;
}
.hamburger:active { background: var(--glow-blue); }

/* 移动端响应式 */
@media (max-width: 768px) {
  .topbar { padding: 10px 12px; gap: 10px; }
  .logo-text { display: none; }
  .side-panel { width: 100%; box-shadow: none; }
}

.main-area {
  flex: 1;
  position: relative;
  overflow: hidden;
}

/* 右侧叙事面板 */
.side-panel {
  position: fixed;
  top: 57px; /* topbar 高度 */
  right: 0;
  width: 360px;
  height: calc(100vh - 57px);
  background: var(--bg-surface);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-left: 1px solid var(--border);
  z-index: 40;
  overflow: hidden;
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.4);
}

.panel-close {
  position: absolute;
  top: 12px;
  right: 14px;
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 20px;
  cursor: pointer;
  z-index: 1;
  line-height: 1;
  transition: color 0.15s;
}
.panel-close:hover { color: var(--text-primary); }

/* 面板从右侧飞入 */
.panel-slide-enter-active { transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s ease; }
.panel-slide-leave-active { transition: transform 0.25s ease-in, opacity 0.2s ease; }
.panel-slide-enter-from  { transform: translateX(100%); opacity: 0; }
.panel-slide-leave-to    { transform: translateX(100%); opacity: 0; }
</style>

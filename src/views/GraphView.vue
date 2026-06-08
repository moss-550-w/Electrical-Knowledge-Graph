<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useGraphStore } from '@/stores/graphStore'
import { useTheme } from '@/composables/useTheme'
import GraphCanvas from '@/components/GraphCanvas.vue'
import SearchBar from '@/components/SearchBar.vue'
import ContextPanel from '@/components/ContextPanel.vue'
import DetailOverlay from '@/components/DetailOverlay.vue'
import PathPlanner from '@/components/PathPlanner.vue'
import TourGuide from '@/components/TourGuide.vue'

const router = useRouter()
const graphStore = useGraphStore()
const { isLight, toggle: toggleTheme } = useTheme()

const tourVisible = ref(false)
const drawerVisible = ref(false)
const detailNodeId = ref('')
const detailVisible = ref(false)
const plannerVisible = ref(false)

// 节点聚焦时自动打开面板
watch(() => graphStore.focusNodeId, (id) => {
  drawerVisible.value = !!id
})

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
        <span class="logo">⚡ 电气知识图谱</span>
      </div>
      <SearchBar />
      <div class="topbar-right">
        <el-button-group class="thread-switch">
          <el-button
            :type="graphStore.activeThread === 'all' ? 'primary' : 'default'"
            size="small"
            @click="graphStore.setThread('all')"
          >全图</el-button>
          <el-button
            :type="graphStore.activeThread === 'motor' ? 'primary' : 'default'"
            size="small"
            @click="graphStore.setThread('motor')"
          >⚙️ 电机控制</el-button>
          <el-button
            :type="graphStore.activeThread === 'storage' ? 'success' : 'default'"
            size="small"
            @click="graphStore.setThread('storage')"
          >🔋 储能BMS</el-button>
        </el-button-group>
        <el-switch
          v-model="graphStore.traceMode"
          active-text="溯源模式"
          inactive-text="普通模式"
          @change="graphStore.toggleTraceMode()"
          size="small"
          class="trace-switch"
        />
        <el-button-group class="level-filter">
          <el-button
            :type="graphStore.showL3Nodes ? 'warning' : 'default'"
            size="small"
            @click="graphStore.toggleLevel('L3')"
          >L3</el-button>
          <el-button
            :type="graphStore.showL2Nodes ? 'primary' : 'default'"
            size="small"
            @click="graphStore.toggleLevel('L2')"
          >L2</el-button>
          <el-button
            size="small"
            @click="graphStore.toggleLevel('L1')"
            :style="{ color: graphStore.showL1Nodes ? '#909399' : '' }"
          >L1</el-button>
        </el-button-group>
        <el-button type="primary" size="small" @click="openPlanner">
          学习路径
        </el-button>
        <el-button
          size="small"
          :type="drawerVisible ? 'primary' : 'default'"
          @click="drawerVisible = !drawerVisible"
        >
          {{ drawerVisible ? '隐藏面板' : '详情面板' }}
        </el-button>
        <el-button size="small" @click="tourVisible = true">新手引导</el-button>
        <el-button size="small" @click="toggleTheme" class="theme-btn">
          {{ isLight ? '🌙 深色' : '☀️ 白色' }}
        </el-button>
      </div>
    </header>

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

.topbar-left { display: flex; align-items: center; }

.logo {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  background: linear-gradient(90deg, #409EFF, #E6A817);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.trace-switch { --el-switch-on-color: #E83333; }

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

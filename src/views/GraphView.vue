<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useGraphStore } from '@/stores/graphStore'
import GraphCanvas from '@/components/GraphCanvas.vue'
import SearchBar from '@/components/SearchBar.vue'
import ContextPanel from '@/components/ContextPanel.vue'
import DetailOverlay from '@/components/DetailOverlay.vue'
import PathPlanner from '@/components/PathPlanner.vue'
import TourGuide from '@/components/TourGuide.vue'

const router = useRouter()
const graphStore = useGraphStore()

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
</style>

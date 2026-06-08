<script setup>
import { useGraphStore } from '@/stores/graphStore'
import { useTheme } from '@/composables/useTheme'

const props = defineProps({
  stacked: { type: Boolean, default: false },   // true = 移动抽屉纵向布局
  panelOpen: { type: Boolean, default: false },  // 详情面板当前是否展开
})
const emit = defineEmits(['open-planner', 'open-saved', 'open-tour', 'toggle-panel', 'close'])

const graphStore = useGraphStore()
const { isLight, toggle: toggleTheme } = useTheme()

// 主线配置（桌面/移动复用，避免重复书写四个按钮）
const threads = [
  { key: 'all', label: '全图', type: 'primary' },
  { key: 'motor', label: '⚙️ 电机控制', type: 'primary' },
  { key: 'storage', label: '🔋 储能BMS', type: 'success' },
  { key: 'wpt', label: '🔌 无线充电', type: 'warning' },
]

// 打开二级浮层 / 切换面板：移动端顺手收起抽屉
function act(event) {
  emit(event)
  if (props.stacked) emit('close')
}
</script>

<template>
  <div class="topbar-controls" :class="{ stacked }">
    <!-- 主线切换 -->
    <div class="ctrl-group">
      <span v-if="stacked" class="ctrl-label">知识主线</span>
      <el-button-group v-if="!stacked" class="thread-switch">
        <el-button
          v-for="t in threads" :key="t.key"
          :type="graphStore.activeThread === t.key ? t.type : 'default'"
          size="small"
          @click="graphStore.setThread(t.key)"
        >{{ t.label }}</el-button>
      </el-button-group>
      <div v-else class="btn-grid thread-grid">
        <el-button
          v-for="t in threads" :key="t.key"
          :type="graphStore.activeThread === t.key ? t.type : 'default'"
          size="small"
          @click="graphStore.setThread(t.key)"
        >{{ t.label }}</el-button>
      </div>
    </div>

    <!-- 溯源模式 -->
    <div class="ctrl-group">
      <el-switch
        :model-value="graphStore.traceMode"
        active-text="溯源模式"
        inactive-text="普通模式"
        @change="graphStore.toggleTraceMode()"
        size="small"
        class="trace-switch"
      />
    </div>

    <!-- 成熟度过滤 -->
    <div class="ctrl-group">
      <span v-if="stacked" class="ctrl-label">成熟度过滤</span>
      <el-button-group v-if="!stacked" class="level-filter">
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
      <div v-else class="btn-grid level-grid level-filter">
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
      </div>
    </div>

    <!-- 功能入口 -->
    <el-button type="primary" size="small" class="ctrl-btn" @click="act('open-planner')">
      学习路径
    </el-button>
    <el-button size="small" class="ctrl-btn" @click="act('open-saved')">我的路径</el-button>
    <el-button
      size="small"
      class="ctrl-btn"
      :type="panelOpen ? 'primary' : 'default'"
      @click="act('toggle-panel')"
    >
      {{ panelOpen ? '隐藏面板' : '详情面板' }}
    </el-button>
    <el-button size="small" class="ctrl-btn" @click="act('open-tour')">新手引导</el-button>
    <el-button size="small" class="ctrl-btn theme-btn" @click="toggleTheme">
      {{ isLight ? '🌙 深色' : '☀️ 白色' }}
    </el-button>
  </div>
</template>

<style scoped>
/* 桌面：单行横排，与改造前一致 */
.topbar-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
.ctrl-group { display: flex; align-items: center; }
.trace-switch { --el-switch-on-color: #E83333; }
.ctrl-label { display: none; }

/* 移动：抽屉内纵向堆叠 */
.topbar-controls.stacked {
  flex-direction: column;
  align-items: stretch;
  gap: 18px;
}
.topbar-controls.stacked .ctrl-group {
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
}
.topbar-controls.stacked .ctrl-label {
  display: block;
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
}
.topbar-controls.stacked .trace-switch { align-self: flex-start; }

/* 网格按钮（替代窄屏下无法换行的 el-button-group） */
.btn-grid { display: grid; gap: 8px; }
.btn-grid.thread-grid { grid-template-columns: 1fr 1fr; }
.btn-grid.level-grid { grid-template-columns: repeat(3, 1fr); }
.btn-grid :deep(.el-button) { margin: 0; width: 100%; }

/* 功能按钮：抽屉内全宽 */
.topbar-controls.stacked .ctrl-btn { width: 100%; margin: 0; }
</style>

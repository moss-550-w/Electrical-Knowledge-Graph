<script setup>
import { ref, computed } from 'vue'
import { useGraphStore } from '@/stores/graphStore'
import { generatePaths } from '@/utils/pathAlgorithm'
import { getMaturityConfig } from '@/utils/maturityTags'

const props = defineProps({
  visible: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'go-review'])

const graphStore = useGraphStore()

const targetId = ref('')
const paths = ref([])
const loading = ref(false)
const generated = ref(false)

// 可选的路径目标节点（电机控制、电力电子等核心应用节点）
const targets = computed(() =>
  graphStore.nodes
    .filter(
      (n) =>
        n.level === 'L3' &&
        ['电机控制', '电力电子', '电力系统'].includes(n.category)
    )
    .map((n) => ({ id: n.id, name: n.name, category: n.category }))
)

async function generate() {
  if (!targetId.value) return
  loading.value = true
  paths.value = generatePaths(targetId.value, graphStore.nodes, graphStore.edges)
  loading.value = false
  generated.value = true
}

function selectPath(pathData) {
  graphStore.setSelectedPath(pathData)
}

function goToReview(pathData) {
  graphStore.setSelectedPath(pathData)
  emit('go-review')
}

const strategyIcons = { theory: '🔬', application: '🔧', control: '🎛️' }
const strategyColors = { theory: '#409EFF', application: '#67C23A', control: '#E6A817' }
</script>

<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="(val) => !val && emit('close')"
    title="多策略学习路径规划"
    width="900px"
    :close-on-click-modal="false"
    @closed="emit('close')"
  >
    <div class="planner-body">
      <!-- 目标选择 -->
      <div class="target-select">
        <label>选择学习目标：</label>
        <el-select
          v-model="targetId"
          placeholder="请选择目标知识点"
          size="large"
          style="width: 360px"
        >
          <el-option
            v-for="t in targets"
            :key="t.id"
            :label="`${t.name}（${t.category}）`"
            :value="t.id"
          />
        </el-select>
        <el-button
          type="primary"
          :disabled="!targetId"
          :loading="loading"
          @click="generate"
          size="large"
        >
          生成三条路径
        </el-button>
      </div>

      <!-- 路径卡片 -->
      <div v-if="generated" class="path-cards">
        <div
          v-for="p in paths"
          :key="p.strategy"
          class="path-card"
          :style="{ borderTopColor: strategyColors[p.strategy] }"
        >
          <div class="path-card-header">
            <span class="path-icon">{{ strategyIcons[p.strategy] }}</span>
            <h4 class="path-title">{{ p.label }}</h4>
            <el-tag
              :color="strategyColors[p.strategy]"
              size="small"
              effect="dark"
              round
            >
              {{ p.difficulty }}
            </el-tag>
          </div>
          <p class="path-desc">{{ p.description }}</p>
          <div class="path-stats">
            <span>节点数：<strong>{{ p.nodeCount }}</strong></span>
          </div>

          <div class="path-nodes">
            <div
              v-for="(n, idx) in p.path"
              :key="n.id"
              class="path-node-item"
            >
              <span class="path-step">{{ idx + 1 }}</span>
              <span class="path-node-name">{{ n.name }}</span>
              <span
                class="path-node-level"
                :style="{ color: getMaturityConfig(n.level).color }"
              >{{ n.level }}</span>
            </div>
          </div>

          <div class="path-actions">
            <el-button size="small" @click="selectPath(p)">保存路径</el-button>
            <el-button size="small" type="primary" @click="goToReview(p)">
              3D 复盘
            </el-button>
          </div>
        </div>
      </div>

      <div v-if="generated && paths.length === 0" class="no-path">
        <p>无法生成路径，请检查图谱数据完整性。</p>
      </div>
    </div>
  </el-dialog>
</template>

<style scoped>
.planner-body {
  padding: 10px 0;
}

.target-select {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.target-select label {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  white-space: nowrap;
}

.path-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

@media (max-width: 768px) {
  .path-cards {
    grid-template-columns: 1fr;
  }
}

.path-card {
  border: 1px solid #ebeef5;
  border-top: 4px solid;
  border-radius: 12px;
  padding: 16px;
  transition: box-shadow 0.2s;
}

.path-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.path-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.path-icon {
  font-size: 20px;
}

.path-title {
  font-size: 15px;
  margin: 0;
  flex: 1;
  color: #303133;
}

.path-desc {
  font-size: 12px;
  color: #909399;
  margin: 0 0 10px;
}

.path-stats {
  font-size: 13px;
  color: #606266;
  margin-bottom: 10px;
}

.path-nodes {
  max-height: 260px;
  overflow-y: auto;
  border-top: 1px solid #ebeef5;
  padding-top: 8px;
  margin-bottom: 12px;
}

.path-node-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 0;
  font-size: 13px;
}

.path-step {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #f0f2f5;
  font-size: 11px;
  font-weight: 600;
  color: #606266;
  flex-shrink: 0;
}

.path-node-name {
  flex: 1;
  color: #303133;
}

.path-node-level {
  font-size: 11px;
  font-weight: 500;
  flex-shrink: 0;
}

.path-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.no-path {
  text-align: center;
  padding: 40px;
  color: #909399;
}
</style>

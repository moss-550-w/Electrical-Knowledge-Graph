<script setup>
import { computed } from 'vue'
import { useGraphStore } from '@/stores/graphStore'
import { getMaturityConfig, getRelationConfig } from '@/utils/maturityTags'

const emit = defineEmits(['open-detail', 'open-planner'])

const graphStore = useGraphStore()

const node = computed(() => graphStore.focusNode)
const hasFocus = computed(() => !!node.value)

const relatedNodes = computed(() => {
  if (!node.value || !node.value.relations) return []
  return node.value.relations
    .filter((r) => graphStore.nodes.find((n) => n.id === r.target))
    .map((r) => {
      const target = graphStore.nodes.find((n) => n.id === r.target)
      const relCfg = getRelationConfig(r.type)
      return { ...r, targetNode: target, config: relCfg }
    })
})

const isL3 = computed(() => node.value?.level === 'L3')

const stats = computed(() => {
  const l3 = graphStore.nodes.filter((n) => n.level === 'L3').length
  const l2 = graphStore.nodes.filter((n) => n.level === 'L2').length
  const l1 = graphStore.nodes.filter((n) => n.level === 'L1').length
  return { l3, l2, l1, total: l3 + l2 + l1 }
})

function openDetail() {
  if (node.value) emit('open-detail', node.value.id)
}

function clearFocus() {
  graphStore.clearFocus()
}
</script>

<template>
  <div class="context-panel">
    <!-- 无焦点状态：概览 -->
    <div v-if="!hasFocus" class="panel-empty">
      <div class="panel-logo">
        <span class="logo-icon">⚡</span>
        <h2>电气知识图谱</h2>
      </div>
      <p class="panel-desc">
        以<strong>网状知识图谱</strong>深度打通电气工程多学科关联。<br />
        点击任意节点开始探索。
      </p>
      <div class="panel-stats">
        <div class="stat-item">
          <span class="stat-num">{{ stats.total }}</span>
          <span class="stat-label">知识点</span>
        </div>
        <div class="stat-item l3">
          <span class="stat-num">{{ stats.l3 }}</span>
          <span class="stat-label">L3·完备</span>
        </div>
        <div class="stat-item l2">
          <span class="stat-num">{{ stats.l2 }}</span>
          <span class="stat-label">L2·核心</span>
        </div>
      </div>
      <el-button type="primary" class="planner-entry" @click="$emit('open-planner')">
        生成学习路径
      </el-button>
    </div>

    <!-- 有焦点节点：详情 -->
    <div v-else class="panel-focus">
      <div class="panel-header">
        <h3>{{ node.name }}</h3>
        <span
          class="level-badge"
          :style="{
            background: getMaturityConfig(node.level).bgColor,
            color: getMaturityConfig(node.level).color,
            borderColor: getMaturityConfig(node.level).color,
          }"
        >{{ getMaturityConfig(node.level).label }}</span>
        <span v-if="node.isGold" class="gold-badge">🔶 金线</span>
      </div>

      <p class="node-summary">{{ node.summary }}</p>

      <el-button
        v-if="isL3"
        type="primary"
        class="detail-btn"
        @click="openDetail"
      >
        展开详情（公式·图解·动图）
      </el-button>

      <div class="node-meta">
        <span class="meta-label">学科分类</span>
        <span class="meta-value">{{ node.category || '未分类' }}</span>
      </div>

      <div v-if="relatedNodes.length > 0" class="related-section">
        <h4>关联节点（{{ relatedNodes.length }}）</h4>
        <div
          v-for="rel in relatedNodes"
          :key="rel.target"
          class="related-item"
          @click="graphStore.setFocusNode(rel.target)"
        >
          <span
            class="related-arrow"
            :style="{ color: rel.config.lineStyle.color }"
          >{{ rel.config.label }}</span>
          <span class="related-name">{{ rel.targetNode.name }}</span>
          <span
            class="related-level"
            :style="{ color: getMaturityConfig(rel.targetNode.level).color }"
          >{{ rel.targetNode.level }}</span>
        </div>
      </div>

      <el-button class="clear-btn" text @click="clearFocus">取消聚焦</el-button>
    </div>
  </div>
</template>

<style scoped>
.context-panel {
  height: 100%;
  padding: 20px;
  overflow-y: auto;
  background: #fff;
}

/* 空状态 */
.panel-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
}

.panel-logo {
  margin-bottom: 16px;
}

.logo-icon {
  font-size: 48px;
}

.panel-logo h2 {
  font-size: 20px;
  margin: 8px 0 0;
  color: #303133;
}

.panel-desc {
  font-size: 14px;
  color: #606266;
  line-height: 1.8;
  margin-bottom: 24px;
}

.panel-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 20px;
  border-radius: 10px;
  background: #f5f7fa;
}

.stat-num {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.stat-item.l3 .stat-num { color: #E6A817; }
.stat-item.l2 .stat-num { color: #409EFF; }

.planner-entry {
  width: 100%;
  border-radius: 10px;
}

/* 聚焦状态 */
.panel-focus {
  animation: fadeIn 0.25s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.panel-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.panel-header h3 {
  font-size: 18px;
  margin: 0;
  color: #303133;
}

.level-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
  border: 1px solid;
}

.gold-badge {
  font-size: 12px;
  color: #E6A817;
  font-weight: 500;
}

.node-summary {
  font-size: 14px;
  color: #606266;
  line-height: 1.8;
  margin-bottom: 16px;
}

.detail-btn {
  width: 100%;
  margin-bottom: 16px;
  border-radius: 10px;
}

.node-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 13px;
}

.meta-label { color: #909399; }
.meta-value { color: #303133; }

.related-section {
  border-top: 1px solid #ebeef5;
  padding-top: 12px;
  margin-bottom: 16px;
}

.related-section h4 {
  font-size: 13px;
  color: #909399;
  margin: 0 0 8px;
  font-weight: 500;
}

.related-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}

.related-item:hover {
  background: #f5f7fa;
}

.related-arrow {
  font-size: 11px;
  white-space: nowrap;
  min-width: 56px;
}

.related-name {
  flex: 1;
  font-size: 13px;
  color: #303133;
}

.related-level {
  font-size: 11px;
  font-weight: 500;
}

.clear-btn {
  width: 100%;
  color: #909399;
}
</style>

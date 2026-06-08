<script setup>
import { ref, computed } from 'vue'
import { useGraphStore } from '@/stores/graphStore'
import { usePathStore } from '@/stores/pathStore'
import { useIsMobile } from '@/composables/useMediaQuery'
import { generatePaths } from '@/utils/pathAlgorithm'
import { getMaturityConfig } from '@/utils/maturityTags'
import { ElMessageBox, ElMessage } from 'element-plus'

const props = defineProps({ visible: Boolean })
const emit = defineEmits(['close', 'go-review'])

const graphStore = useGraphStore()
const pathStore = usePathStore()
const isMobile = useIsMobile()

const targetId = ref('')
const paths = ref([])
const loading = ref(false)
const generated = ref(false)
const scanning = ref(false)   // 演算进行中

const targets = computed(() =>
  graphStore.nodes
    .filter((n) => n.level === 'L3')
    .map((n) => ({ id: n.id, name: n.name, category: n.category }))
    .sort((a, b) => a.category.localeCompare(b.category, 'zh'))
)

async function generate() {
  if (!targetId.value) return
  loading.value = true
  generated.value = false
  scanning.value = true

  const result = generatePaths(targetId.value, graphStore.nodes, graphStore.edges)
  paths.value = result
  loading.value = false

  // 三条路径节点合并，按各路径顺序交叉编排（让三条线同时点亮）
  const maxLen = Math.max(...result.map((p) => p.path.length))
  const sequence = []
  for (let i = 0; i < maxLen; i++) {
    result.forEach((p) => { if (p.path[i]) sequence.push(p.path[i].id) })
  }
  const deduped = [...new Set(sequence)]

  // 清空高亮，逐步追加
  graphStore.highlightedPathIds = []
  const lit = []

  await new Promise((resolve) => {
    let idx = 0
    const tick = setInterval(() => {
      if (idx >= deduped.length) {
        clearInterval(tick)
        resolve()
        return
      }
      lit.push(deduped[idx++])
      // 触发响应式更新
      graphStore.highlightedPathIds = [...lit]
    }, 80)
  })

  scanning.value = false
  generated.value = true
}

async function selectPath(p) {
  const defaultName = `${targets.value.find((t) => t.id === targetId.value)?.name || ''} · ${p.label}`
  try {
    const { value: name } = await ElMessageBox.prompt('为路径命名', '保存路径', {
      inputValue: defaultName,
      confirmButtonText: '保存',
      cancelButtonText: '取消',
      inputValidator: (v) => (v && v.trim() ? true : '名称不能为空'),
    })
    pathStore.savePath(p, name.trim())
    ElMessage.success(`已保存「${name.trim()}」`)
  } catch { /* 取消 */ }
}
function goToReview(p) { graphStore.setSelectedPath(p); emit('go-review') }

const strategyIcons = { theory: '🔬', application: '🔧', control: '🎛️' }
const strategyColors = { theory: '#409EFF', application: '#67C23A', control: '#E6A817' }
</script>

<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="(val) => !val && emit('close')"
    title="多策略学习路径规划"
    :width="isMobile ? '94vw' : '900px'"
    :close-on-click-modal="false"
    @closed="emit('close')"
  >
    <div class="planner-body">
      <div class="target-select">
        <label>选择学习目标：</label>
        <el-select v-model="targetId" placeholder="请选择目标知识点" size="large" :style="{ width: isMobile ? '100%' : '360px' }">
          <el-option
            v-for="t in targets" :key="t.id"
            :label="`${t.name}（${t.category}）`" :value="t.id"
          />
        </el-select>
        <el-button type="primary" :disabled="!targetId" :loading="loading" @click="generate" size="large">
          生成三条路径
        </el-button>
      </div>

      <!-- 演算中：扫描动画提示 -->
      <div v-if="scanning" class="scanning">
        <div class="scan-bar"></div>
        <p>正在图谱中搜索知识关联路径…</p>
      </div>

      <!-- 路径卡片：演算结束后逐张滑入 -->
      <transition-group v-if="generated" name="card-slide" tag="div" class="path-cards">
        <div
          v-for="(p, i) in paths" :key="p.strategy"
          class="path-card"
          :style="{ borderTopColor: strategyColors[p.strategy], transitionDelay: `${i * 120}ms` }"
        >
          <div class="path-card-header">
            <span class="path-icon">{{ strategyIcons[p.strategy] }}</span>
            <h4 class="path-title">{{ p.label }}</h4>
            <el-tag :color="strategyColors[p.strategy]" size="small" effect="dark" round>
              {{ p.difficulty }}
            </el-tag>
          </div>
          <p class="path-desc">{{ p.description }}</p>
          <div class="path-stats"><span>节点数：<strong>{{ p.nodeCount }}</strong></span></div>

          <div class="path-nodes">
            <div v-for="(n, idx) in p.path" :key="n.id" class="path-node-item">
              <span class="path-step">{{ idx + 1 }}</span>
              <span class="path-node-name">{{ n.name }}</span>
              <span class="path-node-level" :style="{ color: getMaturityConfig(n.level).color }">{{ n.level }}</span>
            </div>
          </div>

          <div class="path-actions">
            <el-button size="small" @click="selectPath(p)">保存路径</el-button>
            <el-button size="small" type="primary" @click="goToReview(p)">3D 复盘</el-button>
          </div>
        </div>
      </transition-group>

      <div v-if="generated && paths.length === 0" class="no-path">
        <p>无法生成路径，请检查图谱数据完整性。</p>
      </div>
    </div>
  </el-dialog>
</template>

<style scoped>
.planner-body { padding: 10px 0; }

.target-select {
  display: flex; align-items: center; gap: 12px;
  margin-bottom: 24px; flex-wrap: wrap;
}
.target-select label {
  font-size: 14px; font-weight: 500;
  color: var(--text-primary); white-space: nowrap;
}

/* 演算扫描动画 */
.scanning {
  text-align: center;
  padding: 32px 0;
  color: var(--text-secondary);
  font-size: 14px;
}
.scan-bar {
  width: 240px; height: 3px;
  background: var(--border);
  border-radius: 2px;
  margin: 0 auto 16px;
  overflow: hidden;
  position: relative;
}
.scan-bar::after {
  content: '';
  position: absolute;
  top: 0; left: -60%;
  width: 60%; height: 100%;
  background: linear-gradient(90deg, transparent, #409EFF, transparent);
  animation: scan 1.2s ease-in-out infinite;
}
@keyframes scan { to { left: 100%; } }

/* 路径卡片 */
.path-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
@media (max-width: 768px) { .path-cards { grid-template-columns: 1fr; } }

/* 卡片从右侧滑入 */
.card-slide-enter-active { transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s ease; }
.card-slide-enter-from  { transform: translateX(40px); opacity: 0; }

.path-card {
  border: 1px solid var(--border); border-top: 4px solid;
  border-radius: 12px; padding: 16px;
  background: var(--bg-card);
  transition: box-shadow 0.2s;
}
.path-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.15); }

.path-card-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.path-icon { font-size: 20px; }
.path-title { font-size: 15px; margin: 0; flex: 1; color: var(--text-primary); }
.path-desc { font-size: 12px; color: var(--text-secondary); margin: 0 0 10px; }
.path-stats { font-size: 13px; color: var(--text-secondary); margin-bottom: 10px; }

.path-nodes {
  max-height: 260px; overflow-y: auto;
  border-top: 1px solid var(--border);
  padding-top: 8px; margin-bottom: 12px;
}
.path-node-item { display: flex; align-items: center; gap: 8px; padding: 5px 0; font-size: 13px; }
.path-step {
  display: inline-flex; align-items: center; justify-content: center;
  width: 22px; height: 22px; border-radius: 50%;
  background: var(--glow-blue); font-size: 11px; font-weight: 600;
  color: var(--accent); flex-shrink: 0;
}
.path-node-name { flex: 1; color: var(--text-primary); }
.path-node-level { font-size: 11px; font-weight: 500; flex-shrink: 0; }
.path-actions { display: flex; gap: 8px; justify-content: flex-end; }
.no-path { text-align: center; padding: 40px; color: var(--text-secondary); }
</style>

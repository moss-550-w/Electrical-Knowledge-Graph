<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useGraphStore } from '@/stores/graphStore'
import { usePathStore } from '@/stores/pathStore'
import { useIsMobile } from '@/composables/useMediaQuery'
import { buildShareUrl, rehydratePath } from '@/utils/pathShare'

const props = defineProps({ visible: Boolean })
const emit = defineEmits(['close', 'go-review'])

const router = useRouter()
const graphStore = useGraphStore()
const pathStore = usePathStore()
const isMobile = useIsMobile()

const strategyIcons = { theory: '🔬', application: '🔧', control: '🎛️', '': '⭐' }
const strategyColors = { theory: '#409EFF', application: '#67C23A', control: '#E6A817', '': '#909399' }

const paths = computed(() => pathStore.savedPaths)

function fmtTime(ts) {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  if (m < 1) return '刚刚'
  if (m < 60) return `${m} 分钟前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} 小时前`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d} 天前`
  return new Date(ts).toLocaleDateString('zh-CN')
}

// 加载到图谱高亮
function loadHighlight(rec) {
  graphStore.clearFocus()
  graphStore.highlightedPathIds = [...rec.nodeIds]
  emit('close')
  ElMessage.success(`已在图谱高亮「${rec.name}」`)
}

// 3D 复盘
function review(rec) {
  const full = rehydratePath(rec, graphStore.nodes)
  if (!full) { ElMessage.warning('该路径节点已不存在于当前图谱'); return }
  graphStore.setSelectedPath(full)
  emit('close')
  router.push('/review')
}

// 复制分享链接
async function share(rec) {
  const url = buildShareUrl(rec)
  try {
    await navigator.clipboard.writeText(url)
    ElMessage.success('分享链接已复制到剪贴板')
  } catch {
    // 剪贴板不可用时降级为弹窗展示
    ElMessageBox.alert(url, '复制以下分享链接', { confirmButtonText: '知道了' })
  }
}

async function rename(rec) {
  try {
    const { value } = await ElMessageBox.prompt('输入新的路径名称', '重命名', {
      inputValue: rec.name,
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValidator: (v) => (v && v.trim() ? true : '名称不能为空'),
    })
    pathStore.renamePath(rec.id, value.trim())
    ElMessage.success('已重命名')
  } catch { /* 取消 */ }
}

async function remove(rec) {
  try {
    await ElMessageBox.confirm(`确定删除「${rec.name}」？`, '删除路径', {
      type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消',
    })
    pathStore.removePath(rec.id)
    ElMessage.success('已删除')
  } catch { /* 取消 */ }
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="(val) => !val && emit('close')"
    title="我的学习路径"
    :width="isMobile ? '94vw' : '640px'"
    :close-on-click-modal="false"
    @closed="emit('close')"
  >
    <div v-if="paths.length === 0" class="sp-empty">
      <span class="sp-empty-icon">🗺️</span>
      <p>还没有保存的路径</p>
      <p class="sp-empty-hint">去「学习路径」生成并保存，路径会出现在这里</p>
    </div>

    <div v-else class="sp-list">
      <div v-for="rec in paths" :key="rec.id" class="sp-item"
           :style="{ borderLeftColor: strategyColors[rec.strategy] || '#909399' }">
        <div class="sp-main">
          <div class="sp-title-row">
            <span class="sp-icon">{{ strategyIcons[rec.strategy] || '⭐' }}</span>
            <span class="sp-name">{{ rec.name }}</span>
          </div>
          <div class="sp-meta">
            <span>{{ rec.nodeIds.length }} 个节点</span>
            <span v-if="rec.difficulty" class="sp-dot">·</span>
            <span v-if="rec.difficulty">{{ rec.difficulty }}</span>
            <span class="sp-dot">·</span>
            <span>{{ fmtTime(rec.createdAt) }}</span>
          </div>
        </div>
        <div class="sp-actions">
          <el-button size="small" @click="loadHighlight(rec)">加载高亮</el-button>
          <el-button size="small" type="primary" @click="review(rec)">3D 复盘</el-button>
          <el-button size="small" @click="share(rec)">分享</el-button>
          <el-button size="small" link @click="rename(rec)">重命名</el-button>
          <el-button size="small" link type="danger" @click="remove(rec)">删除</el-button>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<style scoped>
.sp-empty { text-align: center; padding: 48px 20px; color: var(--text-secondary); }
.sp-empty-icon { font-size: 40px; display: block; margin-bottom: 12px; opacity: 0.8; }
.sp-empty-hint { font-size: 12px; color: var(--text-muted); margin-top: 4px; }

.sp-list { display: flex; flex-direction: column; gap: 10px; max-height: 60vh; overflow-y: auto; }
.sp-item {
  border: 1px solid var(--border);
  border-left: 4px solid #909399;
  border-radius: 10px;
  padding: 12px 14px;
  background: var(--bg-card, rgba(22,27,34,0.5));
  display: flex; flex-direction: column; gap: 10px;
}
.sp-title-row { display: flex; align-items: center; gap: 8px; }
.sp-icon { font-size: 18px; }
.sp-name { font-size: 15px; font-weight: 600; color: var(--text-primary); }
.sp-meta { font-size: 12px; color: var(--text-secondary); display: flex; gap: 6px; align-items: center; }
.sp-dot { opacity: 0.5; }
.sp-actions { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
</style>

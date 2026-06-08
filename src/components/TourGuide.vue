<script setup>
import { ref, computed, watch, nextTick } from 'vue'

const props = defineProps({ visible: Boolean })
const emit = defineEmits(['close'])

const step = ref(0)

const steps = [
  {
    target: '.graph-canvas',
    title: '知识图谱 · 核心舞台',
    desc: '这里是所有知识的网状关联图。拖拽可平移，滚轮可缩放，点击任意节点开始探索。金色节点为「金线」知识点，内容最完备——目前已贯通「永磁同步电机矢量控制」「储能·电池管理 BMS」与「电动汽车无线充电」三条金线主干。',
    position: 'center',
  },
  {
    target: '.search-bar',
    title: '全站搜索',
    desc: '输入知识点名称或关键词，快速定位并聚焦图谱中的对应节点。也可用 Ctrl+K 唤起。',
    position: 'bottom',
  },
  {
    target: '.trace-switch',
    title: '溯源模式',
    desc: '开启后点击任意节点，图谱将逆向高亮所有前置依赖知识链——例如从「电机矢量控制」或「电池储能系统」一路追溯到「数学基础」。',
    position: 'bottom',
  },
  {
    target: '.level-filter',
    title: '成熟度过滤',
    desc: 'L3·完备 / L2·核心 / L1·骨架 三级内容分级。可随时隐藏骨架节点，聚焦已完备的金线主干。',
    position: 'bottom',
  },
  {
    target: '.planner-entry',
    title: '学习路径规划',
    desc: '选定一个目标知识点，系统自动生成「理论驱动」「应用驱动」「控制优先」三条差异化路径，并支持 3D 立体复盘。',
    position: 'bottom',
  },
]

const total = steps.length
const current = computed(() => steps[step.value])

// 目标元素的位置信息
const targetRect = ref(null)
const tooltipStyle = ref({})

watch([() => props.visible, step], async ([v]) => {
  if (!v) return
  await nextTick()
  updateRect()
})

function updateRect() {
  const el = document.querySelector(current.value.target)
  if (!el) { targetRect.value = null; return }
  const r = el.getBoundingClientRect()
  const pad = 8
  targetRect.value = {
    left: r.left - pad,
    top: r.top - pad,
    width: r.width + pad * 2,
    height: r.height + pad * 2,
  }
  // 计算 tooltip 位置
  const pos = current.value.position
  const tt = { minWidth: '320px', maxWidth: '400px' }
  if (pos === 'bottom') {
    tt.top = (r.bottom + pad + 12) + 'px'
    tt.left = Math.max(16, r.left) + 'px'
  } else {
    // center
    tt.top = '50%'
    tt.left = '50%'
    tt.transform = 'translate(-50%, -50%)'
  }
  tooltipStyle.value = tt
}

// 遮罩 clip-path：四个矩形拼成镂空效果
const maskStyle = computed(() => {
  const r = targetRect.value
  if (!r || current.value.position === 'center') {
    return { background: 'rgba(0,0,0,0.65)' }
  }
  const { left: x, top: y, width: w, height: h } = r
  const vw = window.innerWidth, vh = window.innerHeight
  return {
    background: 'transparent',
    boxShadow: `0 0 0 9999px rgba(0,0,0,0.65)`,
    position: 'fixed',
    left: x + 'px',
    top: y + 'px',
    width: w + 'px',
    height: h + 'px',
    borderRadius: '6px',
    outline: '9999px solid rgba(0,0,0,0.65)',
    // 用 box-shadow 做镂空遮罩更稳定
  }
})

function next() {
  if (step.value < total - 1) {
    step.value++
  } else {
    close()
  }
}

function prev() {
  if (step.value > 0) step.value--
}

function close() {
  step.value = 0
  emit('close')
}
</script>

<template>
  <teleport to="body">
    <div v-if="visible" class="tour-overlay" @click.self="close">

      <!-- 暗色遮罩（覆盖全屏） -->
      <div class="tour-mask-full" />

      <!-- 高亮框（镂空效果通过 box-shadow 实现） -->
      <div v-if="targetRect && current.position !== 'center'"
           class="tour-highlight"
           :style="{
             left: targetRect.left + 'px',
             top: targetRect.top + 'px',
             width: targetRect.width + 'px',
             height: targetRect.height + 'px',
           }" />

      <!-- Tooltip 卡片 -->
      <div class="tour-card" :style="tooltipStyle">
        <!-- 步骤指示器 -->
        <div class="tour-steps">
          <span
            v-for="i in total" :key="i"
            class="tour-dot"
            :class="{ active: i - 1 === step, done: i - 1 < step }"
          />
        </div>

        <h3 class="tour-title">{{ current.title }}</h3>
        <p class="tour-desc">{{ current.desc }}</p>

        <div class="tour-actions">
          <el-button v-if="step > 0" size="small" @click="prev">上一步</el-button>
          <span class="tour-counter">{{ step + 1 }} / {{ total }}</span>
          <el-button type="primary" size="small" @click="next">
            {{ step === total - 1 ? '完成' : '下一步' }}
          </el-button>
        </div>

        <button class="tour-skip" @click="close">跳过引导 ×</button>
      </div>

    </div>
  </teleport>
</template>

<style scoped>
.tour-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
}

/* 全屏暗色底层 */
.tour-mask-full {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  pointer-events: auto;
}

/* 高亮框：用 box-shadow 镂空遮罩 */
.tour-highlight {
  position: fixed;
  border-radius: 8px;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.6);
  border: 2px solid #409EFF;
  pointer-events: none;
  z-index: 10000;
  animation: pulse-border 1.4s ease infinite;
}

@keyframes pulse-border {
  0%, 100% { border-color: #409EFF; box-shadow: 0 0 0 9999px rgba(0,0,0,0.6), 0 0 0 4px rgba(64,158,255,0.3); }
  50%       { border-color: #66b1ff; box-shadow: 0 0 0 9999px rgba(0,0,0,0.6), 0 0 0 8px rgba(64,158,255,0.15); }
}

/* Tooltip 卡片 */
.tour-card {
  position: fixed;
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px 16px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
  z-index: 10001;
  pointer-events: auto;
  animation: card-in 0.25s ease;
}

@keyframes card-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.tour-steps {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
}

.tour-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #dcdfe6;
  transition: all 0.2s;
}
.tour-dot.active { background: #409EFF; transform: scale(1.3); }
.tour-dot.done   { background: #67C23A; }

.tour-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px;
}

.tour-desc {
  font-size: 13px;
  color: #606266;
  line-height: 1.8;
  margin: 0 0 16px;
}

.tour-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.tour-counter {
  font-size: 12px;
  color: #909399;
  flex: 1;
  text-align: center;
}

.tour-skip {
  display: block;
  margin-top: 10px;
  width: 100%;
  background: none;
  border: none;
  color: #c0c4cc;
  font-size: 12px;
  cursor: pointer;
  text-align: center;
  padding: 4px 0 0;
  transition: color 0.15s;
}
.tour-skip:hover { color: #909399; }
</style>

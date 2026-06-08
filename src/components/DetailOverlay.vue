<script setup>
import { ref, watch, computed, onUnmounted } from 'vue'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { useContentStore } from '@/stores/contentStore'
import { useGraphStore } from '@/stores/graphStore'
import { getMaturityConfig, getRelationConfig } from '@/utils/maturityTags'
import AnimPlayer from './AnimPlayer.vue'

const props = defineProps({
  nodeId: { type: String, default: '' },
  visible: { type: Boolean, default: false },
})
const emit = defineEmits(['close', 'navigate'])

const contentStore = useContentStore()
const graphStore = useGraphStore()

const loading = ref(false)
const detail = ref(null)
const nodeData = ref(null)

// ── 动画状态 ──────────────────────────────────────────
const contentVisible = ref(false)   // 内容区整体淡入
const visibleCount = ref(0)         // 已显示的公式数量（逐条入场）
const canvasRef = ref(null)
let particles = [], animId, timers = []

// ── 数据加载 ──────────────────────────────────────────
watch(
  () => [props.visible, props.nodeId],
  async ([v, id]) => {
    if (!v || !id) return
    // 重置动画状态
    contentVisible.value = false
    visibleCount.value = 0
    nodeData.value = graphStore.nodes.find((n) => n.id === id) || null
    loading.value = true
    detail.value = null
    detail.value = await contentStore.loadDetail(id)
    loading.value = false
    // 内容就绪后触发动画序列
    startAnimations()
  }
)

watch(() => props.visible, (v) => {
  if (!v) stopAnimations()
})

// ── 动画序列 ──────────────────────────────────────────
function startAnimations() {
  timers.forEach(clearTimeout)
  timers = []
  // 1. 内容区淡入
  timers.push(setTimeout(() => { contentVisible.value = true }, 50))
  // 2. 公式逐条入场（每条间隔 150ms）
  const total = renderedFormulas.value.length
  for (let i = 0; i < total; i++) {
    timers.push(setTimeout(() => { visibleCount.value = i + 1 }, 300 + i * 150))
  }
  // 3. Canvas 粒子背景
  timers.push(setTimeout(() => initParticles(), 100))
}

function stopAnimations() {
  timers.forEach(clearTimeout)
  cancelAnimationFrame(animId)
  particles = []
}

onUnmounted(stopAnimations)

// ── Canvas 粒子背景 ───────────────────────────────────
function initParticles() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const W = canvas.width = canvas.offsetWidth
  const H = canvas.height = canvas.offsetHeight

  particles = Array.from({ length: 40 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: Math.random() * 2 + 0.5,
    dx: (Math.random() - 0.5) * 0.4,
    dy: (Math.random() - 0.5) * 0.4,
    alpha: Math.random() * 0.4 + 0.1,
  }))

  cancelAnimationFrame(animId)
  function draw() {
    ctx.clearRect(0, 0, W, H)
    particles.forEach((p) => {
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(64,158,255,${p.alpha})`
      ctx.fill()
      p.x += p.dx; p.y += p.dy
      if (p.x < 0 || p.x > W) p.dx *= -1
      if (p.y < 0 || p.y > H) p.dy *= -1
    })
    // SVG 描边连线（距离 < 100px 的粒子之间画线）
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x
        const dy = particles[i].y - particles[j].y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 100) {
          ctx.beginPath()
          ctx.moveTo(particles[i].x, particles[i].y)
          ctx.lineTo(particles[j].x, particles[j].y)
          ctx.strokeStyle = `rgba(64,158,255,${0.15 * (1 - dist / 100)})`
          ctx.lineWidth = 0.5
          ctx.stroke()
        }
      }
    }
    animId = requestAnimationFrame(draw)
  }
  draw()
}

// ── KaTeX 渲染 ────────────────────────────────────────
function renderLatex(tex, displayMode = true) {
  try { return katex.renderToString(tex, { displayMode, throwOnError: false }) }
  catch { return `<code>${tex}</code>` }
}

const renderedFormulas = computed(() =>
  (detail.value?.formulas || []).map((f) => renderLatex(f))
)

// formulas_steps：每个公式配套的推导步骤（如有）
const formulasWithSteps = computed(() => {
  const steps = detail.value?.formulas_steps || []
  return (detail.value?.formulas || []).map((f, i) => ({
    html: renderLatex(f),
    steps: (steps[i]?.steps || []).map((s) => ({
      latex: renderLatex(s.latex),
      note: s.note,
    })),
  }))
})

const openSteps = ref(new Set())  // 记录哪些公式的推导已展开

function toggleSteps(idx) {
  const s = new Set(openSteps.value)
  s.has(idx) ? s.delete(idx) : s.add(idx)
  openSteps.value = s
}

const relatedNodes = computed(() => {
  if (!nodeData.value?.relations) return []
  return nodeData.value.relations
    .filter((r) => graphStore.nodes.find((n) => n.id === r.target))
    .map((r) => ({
      ...r,
      targetNode: graphStore.nodes.find((n) => n.id === r.target),
      config: getRelationConfig(r.type),
    }))
})

// 跨学科隐性关联节点
const crossFieldNodes = computed(() =>
  nodeData.value ? graphStore.getCrossFieldNodes(nodeData.value.id) : []
)
</script>

<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="(val) => !val && emit('close')"
    :title="nodeData?.name || '知识点详情'"
    fullscreen
    :close-on-click-modal="false"
    @closed="emit('close')"
    class="detail-overlay"
  >
    <div v-if="loading" class="detail-loading">
      <el-skeleton :rows="8" animated />
    </div>

    <div v-else-if="detail || nodeData" class="detail-wrapper">
      <!-- Canvas 粒子背景 -->
      <canvas ref="canvasRef" class="particle-canvas" />

      <!-- 内容区：整体淡入上移 -->
      <div class="detail-content" :class="{ 'content-in': contentVisible }">
        <div class="detail-header">
          <!-- SVG 装饰线（描边动画） -->
          <svg class="header-deco" viewBox="0 0 200 4" preserveAspectRatio="none">
            <path d="M0 2 Q100 0 200 2" stroke="#409EFF" stroke-width="2"
                  fill="none" class="deco-path" />
          </svg>
          <span
            class="level-badge"
            :style="{
              background: getMaturityConfig(nodeData?.level).bgColor,
              color: getMaturityConfig(nodeData?.level).color,
              borderColor: getMaturityConfig(nodeData?.level).color,
            }"
          >{{ getMaturityConfig(nodeData?.level).label }}</span>
          <span v-if="nodeData?.isGold" class="gold-badge">🔶 金线节点</span>
          <span class="category-tag">{{ nodeData?.category }}</span>
        </div>

        <div v-if="detail?.scene" class="scene-card">
          <span class="scene-icon">{{ detail.scene.icon }}</span>
          <p class="scene-text">{{ detail.scene.text }}</p>
        </div>

        <div class="detail-section">
          <h4>概述</h4>
          <p>{{ detail?.description || nodeData?.summary }}</p>
        </div>

        <div v-if="detail?.anim" class="detail-section">
          <h4>原理演示</h4>
          <AnimPlayer
            v-if="contentVisible"
            :key="nodeId"
            :src="detail.anim.src"
            :caption="detail.anim.caption"
          />
        </div>

        <div v-if="formulasWithSteps.length" class="detail-section">
          <h4>核心公式</h4>
          <div
            v-for="(item, idx) in formulasWithSteps"
            :key="idx"
            class="formula-block"
            :class="{ 'formula-in': idx < visibleCount }"
          >
            <!-- 公式本体 -->
            <div class="formula-math" v-html="item.html" />

            <!-- 推导步骤折叠（有 steps 才显示按钮） -->
            <div v-if="item.steps.length" class="steps-toggle">
              <button class="steps-btn" @click="toggleSteps(idx)">
                {{ openSteps.has(idx) ? '▲ 收起推导' : '▼ 展开推导步骤' }}
              </button>
              <transition name="steps-expand">
                <ol v-if="openSteps.has(idx)" class="steps-list">
                  <li
                    v-for="(step, si) in item.steps"
                    :key="si"
                    class="step-item"
                    :style="{ animationDelay: `${si * 60}ms` }"
                  >
                    <div class="step-latex" v-html="step.latex" />
                    <span v-if="step.note" class="step-note">💬 {{ step.note }}</span>
                  </li>
                </ol>
              </transition>
            </div>
          </div>
        </div>

        <div v-if="relatedNodes.length" class="detail-section">
          <h4>关联知识节点</h4>
          <div class="related-grid">
            <div
              v-for="rel in relatedNodes"
              :key="rel.target"
              class="related-card"
              @click="emit('navigate', rel.target)"
            >
              <div class="related-card-header">
                <span class="related-name">{{ rel.targetNode.name }}</span>
                <span class="related-lvl"
                  :style="{ color: getMaturityConfig(rel.targetNode.level).color }"
                >{{ rel.targetNode.level }}</span>
              </div>
              <div class="related-rel" :style="{ color: rel.config.lineStyle.color }">
                {{ rel.config.label }}
              </div>
            </div>
          </div>
        </div>

        <div v-if="!detail && nodeData?.level !== 'L3'" class="detail-empty">
          <p>该节点为{{ getMaturityConfig(nodeData?.level).label }}，尚未编写详细说明。</p>
        </div>

        <!-- 跨学科隐性关联 -->
        <div v-if="crossFieldNodes.length" class="detail-section cross-section">
          <h4>💡 你可能没想到</h4>
          <p class="cross-intro">「{{ nodeData?.name }}」与以下来自不同学科的知识点存在隐性关联——</p>
          <div class="cross-grid">
            <div
              v-for="cn in crossFieldNodes"
              :key="cn.id"
              class="cross-card"
              @click="emit('navigate', cn.id)"
            >
              <div class="cross-card-top">
                <span class="cross-name">{{ cn.name }}</span>
                <span class="cross-cat">{{ cn.category }}</span>
              </div>
              <p v-if="cn.summary" class="cross-summary">{{ cn.summary.slice(0, 50) }}…</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="emit('close')">关闭</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
/* 工程场景卡片 */
.scene-card {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  background: linear-gradient(135deg, rgba(64,158,255,0.08), rgba(64,158,255,0.03));
  border: 1px solid rgba(64,158,255,0.25);
  border-left: 3px solid var(--accent);
  border-radius: 8px;
  padding: 14px 18px;
  margin-bottom: 20px;
}
.scene-icon { font-size: 28px; line-height: 1; flex-shrink: 0; margin-top: 2px; }
.scene-text { font-size: 14px; color: var(--text-secondary); line-height: 1.8; margin: 0; }

/* ── 容器 ─────────────────────────── */
.detail-wrapper {
  position: relative;
  min-height: calc(100vh - 120px);
}

.particle-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.6;
}

/* ── 内容区淡入 + 上移 ──────────────── */
.detail-content {
  position: relative;
  max-width: 900px;
  margin: 0 auto;
  padding: 0 20px;
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.detail-content.content-in {
  opacity: 1;
  transform: translateY(0);
}

/* ── 头部 SVG 描边动画 ──────────────── */
.detail-header {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  padding-bottom: 12px;
}
.header-deco {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 200px;
  height: 4px;
}
.deco-path {
  stroke-dasharray: 210;
  stroke-dashoffset: 210;
  animation: dash-in 0.8s 0.3s ease forwards;
}
@keyframes dash-in {
  to { stroke-dashoffset: 0; }
}

/* ── 公式逐条入场 ───────────────────── */
.formula-block {
  background:rgba(255,255,255,0.95);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px 24px;
  margin-bottom: 12px;
  overflow-x: auto;
  text-align: center;
  opacity: 0;
  transform: translateX(-16px);
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.formula-block.formula-in { opacity: 1; transform: translateX(0); }
.detail-loading { padding: 40px; }
.level-badge { font-size: 12px; padding: 3px 10px; border-radius: 5px; font-weight: 600; border: 1px solid; }
.gold-badge { font-size: 13px; font-weight: 500; }
.category-tag { font-size: 12px; padding: 2px 10px; background: rgba(48,54,61,0.6); border-radius: 4px; color: var(--text-secondary); }
.detail-section { margin-bottom: 28px; }
.detail-section h4 { font-size: 16px; color: var(--text-primary); margin: 0 0 12px; padding-bottom: 8px; border-bottom: 1px solid var(--border); }
.detail-section p { font-size: 15px; color: var(--text-secondary); line-height: 1.9; }
.detail-empty { text-align: center; padding: 60px 20px; color: var(--text-muted); font-size: 14px; }
.related-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
.related-card { padding: 12px; border: 1px solid var(--border); border-radius: 8px; cursor: pointer; transition: all 0.2s; background: rgba(22,27,34,0.5); }
.related-card:hover { border-color: var(--accent); background: var(--glow-blue); }
.related-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.related-name { font-size: 13px; font-weight: 500; color: var(--text-primary); }
.related-lvl { font-size: 11px; font-weight: 600; }
.related-rel { font-size: 11px; }

/* 跨学科关联区块 */
.cross-section h4 { color: #E6A817; border-bottom-color: rgba(230,168,23,0.3); }
.cross-intro { font-size: 13px; color: var(--text-secondary); margin: 0 0 12px; }
.cross-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; }
.cross-card {
  padding: 12px; border-radius: 8px; cursor: pointer; transition: all 0.2s;
  border: 1px solid rgba(230,168,23,0.25);
  background: rgba(230,168,23,0.05);
}
.cross-card:hover { border-color: var(--gold); background: rgba(230,168,23,0.1); }
.cross-card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.cross-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.cross-cat { font-size: 10px; padding: 1px 6px; background: rgba(230,168,23,0.15); color: var(--gold); border-radius: 3px; }
.cross-summary { font-size: 12px; color: var(--text-secondary); line-height: 1.6; margin: 0; }

/* 推导折叠块 */
.formula-math { margin-bottom: 8px; }

.steps-toggle { margin-top: 4px; }

.steps-btn {
  background: none; border: 1px solid var(--border);
  color: var(--accent); font-size: 12px;
  padding: 3px 10px; border-radius: 4px;
  cursor: pointer; transition: all 0.15s;
}
.steps-btn:hover { background: var(--glow-blue); border-color: var(--accent); }

.steps-list {
  list-style: none; padding: 0;
  margin: 10px 0 0;
  border-left: 2px solid rgba(64,158,255,0.3);
  padding-left: 16px;
  display: flex; flex-direction: column; gap: 14px;
}

.step-item {
  animation: step-in 0.3s ease both;
}
@keyframes step-in {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

.step-latex { font-size: 14px; overflow-x: auto; }
.step-note {
  display: block; margin-top: 4px;
  font-size: 12px; color: var(--text-muted);
  font-style: italic;
}

/* 展开/收起过渡 */
.steps-expand-enter-active { transition: opacity 0.25s ease; }
.steps-expand-leave-active { transition: opacity 0.15s ease; }
.steps-expand-enter-from, .steps-expand-leave-to { opacity: 0; }
</style>

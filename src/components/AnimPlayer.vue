<script setup>
import { ref, shallowRef, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  src: { type: String, required: true },
  caption: { type: String, default: '' },
})

const containerRef = ref(null)
const isPaused = ref(false)
const failed = ref(false)       // lottie-web 未安装或素材加载失败 → 降级
const ready = ref(false)

const animInstance = shallowRef(null)

onMounted(async () => {
  try {
    // lottie-web 与动画素材均动态 import，确保按需懒加载、首屏不引入
    const [{ default: lottie }, animMod] = await Promise.all([
      import('lottie-web'),
      import(`@/data/lottie/${props.src}.json`),
    ])
    const animationData = animMod.default || animMod
    if (!containerRef.value) return

    animInstance.value = lottie.loadAnimation({
      container: containerRef.value,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData,
    })
    ready.value = true
  } catch (e) {
    // lottie-web 未安装 / 素材缺失 / 渲染异常 —— 平稳降级，不影响浮层其余内容
    failed.value = true
  }
})

onUnmounted(() => {
  // 离开即销毁，防止内存泄漏与多实例叠加（与项目“离开销毁”原则一致）
  if (animInstance.value) {
    animInstance.value.destroy()
    animInstance.value = null
  }
})

function toggle() {
  const anim = animInstance.value
  if (!anim) return
  if (isPaused.value) {
    anim.play()
    isPaused.value = false
  } else {
    anim.pause()
    isPaused.value = true
  }
}
</script>

<template>
  <div class="anim-player">
    <div v-if="!failed" class="anim-stage">
      <div ref="containerRef" class="anim-canvas" />
      <button
        v-if="ready"
        class="anim-ctrl"
        :title="isPaused ? '播放' : '暂停'"
        @click="toggle"
      >{{ isPaused ? '▶' : '⏸' }}</button>
    </div>

    <!-- 降级占位：lottie-web 未就绪或素材加载失败 -->
    <div v-else class="anim-fallback">
      <span class="anim-fallback-icon">🎞️</span>
      <span class="anim-fallback-text">动图组件未就绪</span>
    </div>

    <p v-if="caption" class="anim-caption">{{ caption }}</p>
  </div>
</template>

<style scoped>
.anim-player {
  margin: 4px 0 8px;
}

.anim-stage {
  position: relative;
  height: 240px;
  border: 1px solid rgba(64, 158, 255, 0.25);
  border-radius: 8px;
  background: rgba(64, 158, 255, 0.04);
  overflow: hidden;
}

.anim-canvas {
  width: 100%;
  height: 100%;
}

.anim-ctrl {
  position: absolute;
  right: 10px;
  bottom: 10px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid rgba(64, 158, 255, 0.4);
  background: rgba(13, 17, 23, 0.7);
  color: var(--accent, #409eff);
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.anim-ctrl:hover {
  background: rgba(64, 158, 255, 0.18);
  border-color: var(--accent, #409eff);
}

.anim-fallback {
  height: 160px;
  border: 1px dashed rgba(139, 148, 158, 0.4);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--text-muted, #8b949e);
  background: rgba(139, 148, 158, 0.04);
}
.anim-fallback-icon { font-size: 26px; opacity: 0.7; }
.anim-fallback-text { font-size: 13px; }

.anim-caption {
  margin: 10px 2px 0;
  font-size: 12px;
  font-style: italic;
  line-height: 1.7;
  color: var(--text-muted, #8b949e);
}
</style>

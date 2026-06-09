/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { VitePWA } from 'vite-plugin-pwa'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({ resolvers: [ElementPlusResolver()] }),
    Components({ resolvers: [ElementPlusResolver()] }),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false, // 手动在 main.js 注册，以弹「已可离线使用」提示
      includeAssets: ['pwa-icon.svg'],
      manifest: {
        name: '电气知识图谱可视化学习平台',
        short_name: '电气图谱',
        description: '网状电气工程知识图谱 · 永磁同步电机矢量控制 / 储能 BMS / 无线充电三金线主干',
        lang: 'zh-CN',
        display: 'standalone',
        orientation: 'any',
        theme_color: '#0d1117',
        background_color: '#0d1117',
        icons: [
          { src: 'pwa-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'pwa-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        // 预缓存全部产物（含懒加载 chunk、Lottie、KaTeX 字体）→ 完整离线
        globPatterns: ['**/*.{js,css,html,json,svg,woff,woff2,ttf,ico,png}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 容纳 echarts/three 大 chunk
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
      devOptions: { enabled: false }, // 开发期不启用 SW，离线验证走 build + preview
    }),
  ],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
  },
  base: process.env.VITE_BASE ?? './',
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('echarts') || id.includes('zrender')) return 'echarts'
          if (id.includes('three')) return 'three'
          if (id.includes('lottie-web') || id.includes('lottie_web')) return 'lottie'
          // element-plus chunk 不再手动指定，让按需加载自动拆分
        },
      },
    },
  },
})

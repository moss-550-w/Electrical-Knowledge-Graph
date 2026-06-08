import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { ElMessage } from 'element-plus'
import { registerSW } from 'virtual:pwa-register'
import './styles/dark.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')

// PWA：注册 Service Worker，autoUpdate 模式后台静默更新；首次缓存完成提示离线就绪
registerSW({
  immediate: true,
  onOfflineReady() {
    ElMessage.success({ message: '已可离线使用', duration: 2500 })
  },
})

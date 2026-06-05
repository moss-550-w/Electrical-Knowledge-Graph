import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

window.onerror = (msg, src, line, col, err) => {
  document.body.innerHTML = `<pre style="color:red;padding:20px">[ERROR] ${msg}\n${src}:${line}:${col}\n${err?.stack || ''}</pre>`
}
window.addEventListener('unhandledrejection', (e) => {
  document.body.innerHTML = `<pre style="color:red;padding:20px">[PROMISE] ${e.reason?.stack || e.reason}</pre>`
})

const app = createApp(App)
app.config.errorHandler = (err, instance, info) => {
  document.body.innerHTML = `<pre style="color:red;padding:20px">[VUE] ${info}\n${err?.stack || err}</pre>`
}
app.use(createPinia())
app.use(router)
app.mount('#app')

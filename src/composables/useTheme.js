import { ref } from 'vue'

const isLight = ref(localStorage.getItem('theme') === 'light')

function applyTheme() {
  document.documentElement.classList.toggle('light', isLight.value)
}

applyTheme()

export function useTheme() {
  function toggle() {
    isLight.value = !isLight.value
    localStorage.setItem('theme', isLight.value ? 'light' : 'dark')
    applyTheme()
  }
  return { isLight, toggle }
}

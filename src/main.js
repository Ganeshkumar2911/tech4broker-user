import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'
import 'vue-color/style.css'
import 'driver.js/dist/driver.css'
import './assets/tour.css'
import 'flag-icons/css/flag-icons.min.css'
import '@cryptofonts/cryptofont/cryptofont.css'
import { initTheme } from '@/utils/theme'
import { initGlobalNumberGuard } from '@/utils/numberGuard'
import Tooltip from '@/components/base/Tooltip.vue'
import Pagination from './components/base/Pagination.vue'
import BaseSelect from './components/base/BaseSelect.vue'
import BaseIcon from './components/base/BaseIcon.vue'
import BaseMenu from './components/base/BaseMenu.vue'
import BaseCard from './components/base/BaseCard.vue'
import BaseBadge from './components/base/BaseBadge.vue'
import TableColumnCustomizer from './components/base/datatable/TableColumnCustomizer.vue'



initTheme()
initGlobalNumberGuard()
const app = createApp(App)

app.use(createPinia())
app.use(router)
app.component('Tooltip', Tooltip)
app.component('Pagination', Pagination)
app.component('BaseSelect', BaseSelect)
app.component('BaseIcon', BaseIcon)
app.component('BaseMenu', BaseMenu)
app.component('BaseCard', BaseCard)
app.component('BaseBadge', BaseBadge)
app.component('TableColumnCustomizer', TableColumnCustomizer)

// Prevent iOS Safari double-tap viewport zooming
let lastTouchEnd = 0
document.addEventListener(
  'touchend',
  (event) => {
    const now = Date.now()
    if (now - lastTouchEnd <= 300) {
      // Don't prevent default on interactive inputs or charts
      const tag = (event.target && event.target.tagName) || ''
      if (!['INPUT', 'TEXTAREA', 'SELECT', 'CANVAS'].includes(tag.toUpperCase())) {
        event.preventDefault()
      }
    }
    lastTouchEnd = now
  },
  { passive: false }
)

// Prevent iOS Safari whole-page gesture zooming 
document.addEventListener('gesturestart', (event) => {
  event.preventDefault()
})
document.addEventListener('gesturechange', (event) => {
  event.preventDefault()
})
document.addEventListener('gestureend', (event) => {
  event.preventDefault()
})

app.mount('#app')
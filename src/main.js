import { createApp } from 'vue'
import './assets/styles/main.css'
import App from './App.vue'
import router from './router'
import { useAuth } from './composables/useAuth'

const { initAuth } = useAuth()

let app
initAuth().then(() => {
  if (!app) {
    app = createApp(App)
    app.use(router)
    app.mount('#app')
  }
})

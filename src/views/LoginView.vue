<template>
  <div class="login-container">
    <div class="login-card card">
      <div class="logo-placeholder">
        <span class="logo-icon">💊</span>
      </div>
      <h1 class="login-title">MediTrack</h1>
      <p class="login-subtitle">Gestión de Entregas Médicas</p>
      
      <div v-if="error" class="error-msg">
        {{ error }}
      </div>
      
      <button @click="handleLogin" class="btn btn-primary btn-block google-btn" :disabled="loading">
        <span v-if="loading">Iniciando sesión...</span>
        <span v-else>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google Logo" class="google-icon" />
          Iniciar sesión con Google
        </span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { signIn } = useAuth()

const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  loading.value = true
  error.value = ''
  
  try {
    await signIn()
    router.push('/')
  } catch (err) {
    console.error('Login error:', err)
    error.value = 'Error al iniciar sesión. Por favor intenta nuevamente.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: var(--spacing-md);
  background-color: var(--color-bg);
}

.login-card {
  width: 100%;
  max-width: 400px;
  text-align: center;
  padding: var(--spacing-xl);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.logo-placeholder {
  width: 80px;
  height: 80px;
  background-color: var(--color-primary-dark);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--spacing-md);
}

.logo-icon {
  font-size: 40px;
}

.login-title {
  margin-bottom: var(--spacing-xs);
  color: var(--color-primary-dark);
}

.login-subtitle {
  color: var(--color-text-light);
  margin-bottom: var(--spacing-xl);
}

.google-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  background-color: white;
  color: #757575;
  border: 1px solid #ddd;
}

.google-btn:hover {
  background-color: #f5f5f5;
  box-shadow: 0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15);
}

.google-btn:active {
  background-color: #eeeeee;
}

.google-icon {
  width: 18px;
  height: 18px;
}

.error-msg {
  color: var(--color-danger);
  margin-bottom: var(--spacing-md);
  font-size: var(--font-size-sm);
}
</style>

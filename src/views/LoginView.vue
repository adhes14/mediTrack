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

      <form @submit.prevent="handleEmailAuth" class="auth-form">
        <div v-if="!isLogin" class="form-group">
          <label>Nombre Completo *</label>
          <input type="text" v-model="displayName" class="form-control" required placeholder="Ej. Juan Pérez" />
        </div>
        
        <div v-if="!isLogin" class="form-group">
          <label>Número de Celular *</label>
          <input type="tel" v-model="phone" class="form-control" required placeholder="Ej. 70012345" />
        </div>

        <div class="form-group">
          <label>Correo Electrónico *</label>
          <input type="email" v-model="email" class="form-control" required placeholder="correo@ejemplo.com" />
        </div>

        <div class="form-group">
          <label>Contraseña *</label>
          <input type="password" v-model="password" class="form-control" required placeholder="******" />
        </div>

        <div v-if="isLogin" class="forgot-password">
          <a href="#" @click.prevent="handleResetPassword">¿Olvidaste tu contraseña?</a>
        </div>

        <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
          <span v-if="loading">Procesando...</span>
          <span v-else>{{ isLogin ? 'Iniciar Sesión' : 'Registrarse' }}</span>
        </button>
      </form>

      <div class="auth-toggle">
        <a href="#" @click.prevent="isLogin = !isLogin">
          {{ isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión' }}
        </a>
      </div>

      <div class="divider"><span>O</span></div>
      
      <button @click="handleGoogleLogin" class="btn btn-block google-btn" :disabled="loading">
        <span v-if="loading">Iniciando sesión...</span>
        <span v-else>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google Logo" class="google-icon" />
          Continuar con Google
        </span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { signIn, signInEmail, registerEmail, resetPassword, isAuthenticated, isProfileComplete } = useAuth()

const isLogin = ref(true)
const email = ref('')
const password = ref('')
const displayName = ref('')
const phone = ref('')

const loading = ref(false)
const error = ref('')

// Watch for authentication to automatically navigate
watch(isAuthenticated, (newVal) => {
  if (newVal) {
    if (!isProfileComplete.value) {
      router.push('/complete-profile')
    } else {
      router.push('/')
    }
  }
}, { immediate: true })

const handleEmailAuth = async () => {
  loading.value = true
  error.value = ''
  
  try {
    if (isLogin.value) {
      await signInEmail(email.value, password.value)
    } else {
      await registerEmail(email.value, password.value, displayName.value, phone.value)
    }
    // Redirection handled by watch
  } catch (err) {
    console.error('Email Auth error:', err)
    if (err.code === 'auth/email-already-in-use') {
      error.value = 'El correo ya está en uso. Si usaste Google antes, intenta "Recuperar Contraseña".'
    } else {
      error.value = 'Error de autenticación. Verifica tus credenciales.'
    }
    loading.value = false
  }
}

const handleResetPassword = async () => {
  if (!email.value) {
    error.value = 'Por favor ingresa tu correo electrónico para recuperar tu contraseña.'
    return
  }
  
  loading.value = true
  error.value = ''
  
  try {
    await resetPassword(email.value)
    error.value = 'Correo de recuperación enviado. Revisa tu bandeja de entrada.'
  } catch (err) {
    console.error('Reset Password error:', err)
    error.value = 'Error al enviar el correo de recuperación. Verifica que tu correo esté registrado.'
  } finally {
    loading.value = false
  }
}

const handleGoogleLogin = async () => {
  loading.value = true
  error.value = ''
  
  try {
    await signIn()
    // Redirection handled by watch
  } catch (err) {
    console.error('Google Login error:', err)
    error.value = 'Error al iniciar sesión con Google. Por favor intenta nuevamente.'
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

.auth-form {
  width: 100%;
  text-align: left;
}

.form-group {
  margin-bottom: var(--spacing-md);
}

.form-group label {
  display: block;
  margin-bottom: var(--spacing-xs);
  color: var(--color-text-light);
  font-size: var(--font-size-sm);
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-md);
}

.form-control:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(9, 132, 227, 0.2);
}

.auth-toggle {
  margin-top: var(--spacing-md);
  font-size: var(--font-size-sm);
}

.auth-toggle a {
  color: var(--color-primary);
  text-decoration: none;
}

.auth-toggle a:hover {
  text-decoration: underline;
}

.forgot-password {
  margin-top: calc(var(--spacing-xs) * -1);
  margin-bottom: var(--spacing-md);
  text-align: right;
  font-size: var(--font-size-sm);
}

.forgot-password a {
  color: var(--color-primary);
  text-decoration: none;
}

.forgot-password a:hover {
  text-decoration: underline;
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  width: 100%;
  margin: var(--spacing-lg) 0;
  color: var(--color-text-light);
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid var(--color-border);
}

.divider span {
  padding: 0 10px;
  font-size: var(--font-size-sm);
}
</style>

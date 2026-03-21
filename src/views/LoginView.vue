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

      <div v-if="infoMessage" class="info-msg">
        {{ infoMessage }}
      </div>

      <!-- 1. State: Logged in but NOT verified -->
      <div v-if="isAuthenticated && !isEmailVerified" class="verify-msg">
        <h3>Verifica tu correo</h3>
        <p>Tu cuenta aún no ha sido verificada. Revisa tu bandeja de entrada o haz clic en el botón de abajo si ya verificaste.</p>
        <button @click="checkVerificationStatus" class="btn btn-primary" :disabled="loading">
          Ya verifiqué mi correo
        </button>
        <button @click="signOut" class="btn btn-link">Cerrar sesión</button>
      </div>

      <!-- 2. State: Account Linking Flow (Only for verified or new links) -->
      <div v-else-if="needsLinking" class="linking-container">
        <p class="linking-text">Ya tienes una cuenta con <strong>{{ email }}</strong>. Ingresa tu contraseña para vincularla con Google.</p>
        <div class="form-group">
          <label>Contraseña *</label>
          <input type="password" v-model="password" class="form-control" required placeholder="******" />
        </div>
        <button @click="handleLinkAccount" class="btn btn-primary btn-block" :disabled="loading">
          <span v-if="loading">Vinculando...</span>
          <span v-else>Vincular y Continuar</span>
        </button>
        <button @click="needsLinking = false; error = '';" class="btn btn-link btn-block">Cancelar</button>
      </div>

      <!-- 3. State: Normal Login / Register -->
      <form v-else-if="!isAuthenticated" @submit.prevent="handleEmailAuth" class="auth-form">
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

      <div v-if="!isAuthenticated" class="auth-toggle">
        <a href="#" @click.prevent="isLogin = !isLogin">
          {{ isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión' }}
        </a>
      </div>

      <div v-if="!isAuthenticated" class="divider"><span>O</span></div>
      
      <button v-if="!isAuthenticated" @click="handleGoogleLogin" class="btn btn-block google-btn" :disabled="loading">
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
const { 
  signIn, 
  signInEmail, 
  registerEmail, 
  resetPassword, 
  isAuthenticated, 
  isProfileComplete, 
  isEmailVerified,
  signInAndLinkGoogle,
  getGoogleCredentialFromError,
  refreshCurrentUser,
  signOut
} = useAuth()

const isLogin = ref(true)
const email = ref('')
const password = ref('')
const displayName = ref('')
const phone = ref('')

const loading = ref(false)
const error = ref('')
const infoMessage = ref('')
const needsLinking = ref(false)
const pendingCredential = ref(null)

// Watch for authentication to automatically navigate
watch([isAuthenticated, isEmailVerified], ([newAuth, newVerify]) => {
  if (newAuth && newVerify) {
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
      infoMessage.value = '¡Registro exitoso! Por favor verifica tu correo electrónico para mayor seguridad.'
    }
    // Redirection handled by watch
  } catch (err) {
    console.error('Email Auth error:', err)
    if (err.code === 'auth/email-already-in-use') {
      error.value = 'El correo ya está en uso. Si usaste Google antes, intenta "Recuperar Contraseña".'
    } else if (err.code === 'auth/invalid-credential') {
      error.value = 'Credenciales inválidas. Verifica tu correo y contraseña.'
    } else {
      error.value = 'Error de autenticación. Verifica tus credenciales.'
    }
    loading.value = false
  }
}

const checkVerificationStatus = async () => {
  loading.value = true
  try {
    const user = await refreshCurrentUser()
    if (user?.emailVerified) {
      // Refresh logic already triggers the watch if values change
      infoMessage.value = '¡Correo verificado con éxito!'
    } else {
      error.value = 'El correo aún no ha sido verificado. Por favor revisa tu bandeja de entrada.'
    }
  } catch (err) {
    console.error('Check verification error:', err)
  } finally {
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
  infoMessage.value = ''
  needsLinking.value = false
  
  try {
    await signIn()
    // Redirection handled by watch
  } catch (err) {
    console.error('Google Login error:', err)
    if (err.code === 'auth/account-exists-with-different-credential') {
      const credential = getGoogleCredentialFromError(err)
      if (credential) {
        needsLinking.value = true
        email.value = err.customData.email
        pendingCredential.value = credential
        error.value = 'Ya existe una cuenta con este correo. Por favor ingresa tu contraseña para vincularla.'
      } else {
        error.value = 'Error al obtener las credenciales de Google para vincular.'
      }
    } else {
      error.value = 'Error al iniciar sesión con Google. Por favor intenta nuevamente.'
    }
    loading.value = false
  }
}

const handleLinkAccount = async () => {
  if (!password.value) {
    error.value = 'Por favor ingresa tu contraseña para vincular la cuenta.'
    return
  }
  
  loading.value = true
  error.value = ''
  
  try {
    await signInAndLinkGoogle(email.value, password.value, pendingCredential.value)
    // Success - Redirection handled by watch
  } catch (err) {
    console.error('Linking error:', err)
    if (err.code === 'auth/email-not-verified') {
      error.value = err.message
      needsLinking.value = false
      pendingCredential.value = null
    } else {
      error.value = 'Error al vincular la cuenta. Verifica tu contraseña.'
    }
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
  background-color: rgba(225, 112, 85, 0.1);
  padding: 8px;
  border-radius: 4px;
}

.verify-msg {
  border: 1px solid var(--color-primary);
  background-color: rgba(9, 132, 227, 0.05);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--spacing-md);
}

.verify-msg h3 {
  color: var(--color-primary-dark);
  margin-bottom: var(--spacing-sm);
}

.verify-msg p {
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-md);
  color: var(--color-text-light);
}

.info-msg {
  color: var(--color-primary-dark);
  margin-bottom: var(--spacing-md);
  font-size: var(--font-size-sm);
  background-color: rgba(9, 132, 227, 0.1);
  padding: 8px;
  border-radius: 4px;
}

.linking-container {
  width: 100%;
  text-align: left;
}

.linking-text {
  margin-bottom: var(--spacing-md);
  font-size: var(--font-size-sm);
  color: var(--color-text-light);
}

.btn-link {
  background: none;
  border: none;
  color: var(--color-primary);
  text-decoration: underline;
  cursor: pointer;
  margin-top: 10px;
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

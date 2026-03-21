<template>
  <div class="container">
    <div class="profile-card card">
      <h2>Mi Perfil</h2>
      
      <div v-if="success" class="alert alert-success">{{ success }}</div>
      <div v-if="error" class="alert alert-danger">{{ error }}</div>

      <div class="profile-header">
        <div class="avatar-container">
          <img :src="currentUser?.photoURL || 'https://via.placeholder.com/100'" alt="Avatar" class="profile-avatar" />
          <div class="photo-info">La fotografía principal se gestiona desde tu cuenta de Google.</div>
        </div>
        <div class="user-main-info">
          <h3>{{ currentUser?.displayName }}</h3>
          <p>{{ currentUser?.email }}</p>
        </div>
      </div>

      <hr class="divider" />

      <form @submit.prevent="handleUpdateProfile" class="profile-form">
        <h4>Datos Personales</h4>
        <div class="form-group">
          <label for="displayName">Nombre Completo</label>
          <input type="text" id="displayName" v-model="form.displayName" required />
        </div>
        <div class="form-group">
          <label for="phone">Teléfono / Celular</label>
          <input type="tel" id="phone" v-model="form.phone" required />
        </div>
        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Guardando...' : 'Actualizar Datos' }}
        </button>
      </form>

      <hr class="divider" />

      <form @submit.prevent="handleUpdatePassword" class="profile-form">
        <h4>Cambiar Contraseña</h4>
        <div class="form-group">
          <label for="newPassword">Nueva Contraseña</label>
          <div class="password-input-wrapper">
            <input 
              :type="showPassword ? 'text' : 'password'" 
              id="newPassword" 
              v-model="passwordForm.newPassword" 
              required 
              placeholder="Mínimo 6 caracteres"
            />
            <button type="button" class="toggle-password" @click="showPassword = !showPassword">
              {{ showPassword ? '👁️' : '👁️‍🗨️' }}
            </button>
          </div>
        </div>
        <div class="form-group">
          <label for="confirmPassword">Confirmar Nueva Contraseña</label>
          <div class="password-input-wrapper">
            <input 
              :type="showConfirmPassword ? 'text' : 'password'" 
              id="confirmPassword" 
              v-model="passwordForm.confirmPassword" 
              required 
            />
            <button type="button" class="toggle-password" @click="showConfirmPassword = !showConfirmPassword">
              {{ showConfirmPassword ? '👁️' : '👁️‍🗨️' }}
            </button>
          </div>
        </div>
        <button type="submit" class="btn btn-secondary" :disabled="pwdLoading">
          {{ pwdLoading ? 'Cambiando...' : 'Cambiar Contraseña' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAuth } from '../composables/useAuth'

const { currentUser, updateProfile, signOut } = useAuth()
// We'll need a way to update password, let's assume we'll add it to useAuth or call service directly
// For now I'll use a placeholder and then fix AuthService/useAuth
import { authService } from '../services/AuthService'

const loading = ref(false)
const pwdLoading = ref(false)
const error = ref('')
const success = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const form = reactive({
  displayName: '',
  phone: ''
})

const passwordForm = reactive({
  newPassword: '',
  confirmPassword: ''
})

onMounted(() => {
  if (currentUser.value) {
    form.displayName = currentUser.value.displayName || ''
    form.phone = currentUser.value.phone || ''
  }
})

const handleUpdateProfile = async () => {
  loading.value = true
  error.value = ''
  success.value = ''
  try {
    await updateProfile(form.displayName, form.phone)
    success.value = 'Perfil actualizado correctamente'
  } catch (err) {
    console.error(err)
    error.value = 'Error al actualizar el perfil'
  } finally {
    loading.value = false
  }
}

const handleUpdatePassword = async () => {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    error.value = 'Las contraseñas no coinciden'
    return
  }
  if (passwordForm.newPassword.length < 6) {
    error.value = 'La contraseña debe tener al menos 6 caracteres'
    return
  }

  pwdLoading.value = true
  error.value = ''
  success.value = ''
  try {
    // We'll implement this method in AuthService/useAuth next
    await authService.updateUserPassword(passwordForm.newPassword)
    success.value = 'Contraseña actualizada correctamente'
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch (err) {
    console.error(err)
    if (err.code === 'auth/requires-recent-login') {
      error.value = 'Esta operación es sensible y requiere una autenticación reciente. Por favor, cierra sesión e inicia sesión de nuevo para cambiar tu contraseña.'
    } else {
      error.value = 'Error al actualizar la contraseña: ' + (err.message || 'Error desconocido')
    }
  } finally {
    pwdLoading.value = false
  }
}
</script>

<style scoped>
.profile-card {
  max-width: 600px;
  margin: var(--spacing-lg) auto;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.avatar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  max-width: 150px;
}

.profile-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--color-primary);
}

.photo-info {
  font-size: 10px;
  color: var(--color-text-light);
  text-align: center;
}

.user-main-info h3 {
  margin-bottom: var(--spacing-xs);
}

.user-main-info p {
  color: var(--color-text-light);
}

.divider {
  border: 0;
  border-top: 1px solid var(--color-border);
  margin: var(--spacing-xl) 0;
}

.profile-form h4 {
  margin-bottom: var(--spacing-md);
  color: var(--color-text);
  font-size: var(--font-size-lg);
}

.password-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input-wrapper input {
  margin-bottom: 0;
  padding-right: 40px;
}

.toggle-password {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  font-size: 18px;
  padding: var(--spacing-xs);
  color: var(--color-text-light);
}

.alert {
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--spacing-md);
}

.alert-success {
  background-color: #dcfce7;
  color: #15803d;
  border: 1px solid #86efac;
}

.alert-danger {
  background-color: #fee2e2;
  color: #b91c1c;
  border: 1px solid #fca5a5;
}

@media (max-width: 600px) {
  .profile-header {
    flex-direction: column;
    text-align: center;
  }
}
</style>

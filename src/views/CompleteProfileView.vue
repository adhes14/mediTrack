<template>
  <div class="complete-profile-container">
    <div class="complete-profile-card card">
      <h1 class="title">Completar Perfil</h1>
      <p class="subtitle">Por favor, completa la siguiente información para continuar usando la aplicación.</p>
      
      <div v-if="error" class="error-msg">
        {{ error }}
      </div>
      
      <form @submit.prevent="handleSubmit" class="profile-form">
        <div class="form-group">
          <label>Nombre Completo *</label>
          <input type="text" v-model="displayName" class="form-control" required placeholder="Ej. Juan Pérez" />
        </div>
        
        <div class="form-group">
          <label>Número de Celular *</label>
          <input type="tel" v-model="phone" class="form-control" required placeholder="Ej. 70012345" />
        </div>

        <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
          <span v-if="loading">Guardando...</span>
          <span v-else>Guardar y Continuar</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { currentUser, updateProfile } = useAuth()

const displayName = ref('')
const phone = ref('')

const loading = ref(false)
const error = ref('')

onMounted(() => {
    if (currentUser.value?.displayName) {
        displayName.value = currentUser.value.displayName
    }
    if (currentUser.value?.phone) {
        phone.value = currentUser.value.phone
    }
})

const handleSubmit = async () => {
  loading.value = true
  error.value = ''
  
  try {
    if (!displayName.value || !phone.value) {
        error.value = 'Nombre y Celular son requeridos'
        loading.value = false
        return
    }
    await updateProfile(displayName.value, phone.value)
    router.push('/')
  } catch (err) {
    console.error('Update profile error:', err)
    error.value = 'Error al actualizar perfil. Por favor intenta nuevamente.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.complete-profile-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: var(--spacing-md);
  background-color: var(--color-bg);
}

.complete-profile-card {
  width: 100%;
  max-width: 400px;
  text-align: center;
  padding: var(--spacing-xl);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.title {
  margin-bottom: var(--spacing-xs);
  color: var(--color-primary-dark);
}

.subtitle {
  color: var(--color-text-light);
  margin-bottom: var(--spacing-xl);
}

.error-msg {
  color: var(--color-danger);
  margin-bottom: var(--spacing-md);
  font-size: var(--font-size-sm);
}

.profile-form {
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
</style>

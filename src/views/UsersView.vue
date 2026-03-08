<template>
  <div class="container">
    <div class="header-actions">
      <h2>Gestión de Usuarios</h2>
    </div>

    <!-- Error/Success Messages -->
    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    <div v-if="success" class="alert alert-success">{{ success }}</div>

    <!-- Users List -->
    <div class="users-list">
      <div v-if="loading" class="loading-state">Cargando usuarios...</div>
      
      <div v-else-if="users.length === 0" class="empty-state">
        <span class="empty-icon">👥</span>
        <p>No hay usuarios registrados</p>
      </div>

      <div v-else class="user-card card" v-for="user in users" :key="user.id">
        <div class="user-info">
          <img :src="user.photoURL || 'https://via.placeholder.com/40'" alt="Avatar" class="user-avatar" />
          <div class="user-details">
            <h3>{{ user.displayName || 'Usuario sin nombre' }}</h3>
            <p>{{ user.email }}</p>
          </div>
        </div>
        
        <div class="user-actions">
          <div class="role-selector">
            <label :for="'role-' + user.id">Rol:</label>
            <select :id="'role-' + user.id" v-model="user.role" @change="updateUserRole(user)" :disabled="isCurrentUser(user.id) || updating === user.id">
              <option value="read_only">Solo Lectura</option>
              <option value="assistant">Asistente</option>
              <option value="manager">Encargado</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          
          <button 
            @click="confirmDelete(user)" 
            class="btn-icon btn-delete"
            title="Eliminar usuario"
            :disabled="isCurrentUser(user.id) || updating === user.id"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { dbService } from '../services/DatabaseService'
import { useAuth } from '../composables/useAuth'

const { currentUser } = useAuth()
const users = ref([])
const loading = ref(true)
const updating = ref(null)
const error = ref('')
const success = ref('')

const fetchUsers = async () => {
  try {
    loading.value = true
    error.value = ''
    users.value = await dbService.getAll('users')
  } catch (err) {
    console.error('Error fetching users:', err)
    error.value = 'Error al cargar los usuarios'
  } finally {
    loading.value = false
  }
}

const isCurrentUser = (uid) => {
  return currentUser.value?.uid === uid
}

const showMessage = (msg, isError = false) => {
  if (isError) {
    error.value = msg
    success.value = ''
  } else {
    success.value = msg
    error.value = ''
  }
  setTimeout(() => {
    error.value = ''
    success.value = ''
  }, 3000)
}

const updateUserRole = async (user) => {
  try {
    updating.value = user.id
    error.value = ''
    await dbService.update('users', {
      id: user.id,
      role: user.role
    })
    showMessage(`Rol de ${user.displayName || user.email} actualizado a ${user.role}`)
  } catch (err) {
    console.error('Error updating user role:', err)
    showMessage('Error al actualizar el rol', true)
    // Revert visually by refetching
    await fetchUsers()
  } finally {
    updating.value = null
  }
}

const confirmDelete = async (user) => {
  if (confirm(`¿Estás seguro de que deseas eliminar al usuario ${user.displayName || user.email}? Esta acción cortará su acceso, pero necesitará ser eliminado de Authentication en la consola de Firebase también.`)) {
    try {
      updating.value = user.id
      await dbService.delete('users', user.id)
      showMessage(`Usuario ${user.displayName || user.email} eliminado`)
      users.value = users.value.filter(u => u.id !== user.id)
    } catch (err) {
      console.error('Error deleting user:', err)
      showMessage('Error al eliminar el usuario', true)
    } finally {
      updating.value = null
    }
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.user-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.user-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--color-primary);
}

.user-details h3 {
  margin: 0 0 4px 0;
  font-size: var(--font-size-lg);
  color: var(--color-text);
}

.user-details p {
  margin: 0;
  color: var(--color-text-light);
  font-size: var(--font-size-sm);
}

.user-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.role-selector {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.role-selector label {
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
}

.role-selector select {
  margin-bottom: 0;
  padding: var(--spacing-sm) var(--spacing-md);
  min-width: 15rem;
}

.btn-icon {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  padding: var(--spacing-xs);
  opacity: 0.7;
  transition: opacity 0.2s, transform 0.1s;
}

.btn-icon:hover {
  opacity: 1;
  transform: scale(1.1);
}

.btn-icon:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  transform: none;
}

.btn-delete:hover {
  color: var(--color-danger);
}

.alert {
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--spacing-md);
  font-weight: var(--font-weight-medium);
}

.alert-danger {
  background-color: #fee2e2;
  color: #b91c1c;
  border: 1px solid #fca5a5;
}

.alert-success {
  background-color: #dcfce7;
  color: #15803d;
  border: 1px solid #86efac;
}

.empty-state, .loading-state {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--color-text-light);
}

.empty-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: var(--spacing-sm);
}

@media (max-width: 768px) {
  .user-card {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .user-actions {
    width: 100%;
    justify-content: space-between;
    margin-top: var(--spacing-sm);
  }
  
  .role-selector select {
    min-width: 0;
    width: auto;
  }
}
</style>

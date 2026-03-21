<template>
  <nav class="navbar">
    <router-link to="/" class="nav-item" active-class="active">
      <span class="icon">📅</span>
      <span class="label">Agenda</span>
    </router-link>
    <router-link v-if="!isReadOnly" to="/patients" class="nav-item" active-class="active">
      <span class="icon">👥</span>
      <span class="label">Pacientes</span>
    </router-link>
    <router-link v-if="!isReadOnly" to="/medicines" class="nav-item" active-class="active">
      <span class="icon">💊</span>
      <span class="label">Fármac.</span>
    </router-link>
    <router-link to="/reports" class="nav-item" active-class="active">
      <span class="icon">📊</span>
      <span class="label">Reportes</span>
    </router-link>
    <router-link v-if="isAdmin" to="/users" class="nav-item" active-class="active">
      <span class="icon">⚙️</span>
      <span class="label">Admin</span>
    </router-link>
  </nav>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { isReadOnly, isAdmin, signOut } = useAuth()

const handleSignOut = async () => {
  await signOut()
  router.push('/login')
}
</script>

<style scoped>
.navbar {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: var(--nav-height);
  background-color: var(--color-surface);
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 1000;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--color-text-light);
  font-size: 12px;
  flex: 1;
  height: 100%;
}

.nav-item .icon {
  font-size: 20px;
  margin-bottom: 2px;
}

.nav-item.active {
  color: var(--color-primary);
}

.logout-btn {
  background: none;
  border: none;
  cursor: pointer;
}

.logout-btn:hover {
  background-color: var(--color-bg);
}
</style>

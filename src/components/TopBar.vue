<template>
  <header class="topbar">
    <div class="topbar-content">
      <div class="user-menu" @click.stop="toggleMenu" v-if="currentUser" ref="menuContainer">
        <span class="user-name">{{ currentUser.displayName || 'Usuario' }}</span>
        <div class="avatar-circle">
          <img v-if="currentUser.photoURL" :src="currentUser.photoURL" alt="Profile" class="avatar-img" />
          <span v-else class="avatar-initial">{{ userInitial }}</span>
        </div>
        
        <!-- Dropdown Menu -->
        <transition name="fade">
          <div v-if="showMenu" class="dropdown-menu card">
            <router-link to="/profile" class="dropdown-item" @click="showMenu = false">
              <span class="icon">👤</span> Perfil
            </router-link>
            <button @click="handleSignOut" class="dropdown-item logout">
              <span class="icon">🚪</span> Cerrar Sesión
            </button>
          </div>
        </transition>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { currentUser, signOut } = useAuth()

const showMenu = ref(false)
const menuContainer = ref(null)

const userInitial = computed(() => {
  if (!currentUser.value?.displayName) return '?'
  return currentUser.value.displayName.charAt(0).toUpperCase()
})

const toggleMenu = () => {
  showMenu.value = !showMenu.value
}

const handleSignOut = async () => {
  showMenu.value = false
  await signOut()
  router.push('/login')
}

const handleClickOutside = (event) => {
  if (menuContainer.value && !menuContainer.value.contains(event.target)) {
    showMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.topbar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: var(--header-height);
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  z-index: 1001;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.topbar-content {
  max-width: 1200px;
  margin: 0 auto;
  height: 100%;
  padding: 0 var(--spacing-md);
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  position: relative;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-md);
  transition: background-color 0.2s;
}

.user-menu:hover {
  background-color: var(--color-bg);
}

.user-name {
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
  font-size: var(--font-size-sm);
}

.avatar-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 2px solid var(--color-border);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-initial {
  color: white;
  font-weight: var(--font-weight-bold);
  font-size: 16px;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 180px;
  padding: var(--spacing-xs) 0;
  z-index: 1002;
  border: 1px solid var(--color-border);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  color: var(--color-text);
  text-decoration: none;
  font-size: var(--font-size-sm);
  width: 100%;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s;
}

.dropdown-item:hover {
  background-color: var(--color-bg);
  color: var(--color-primary);
}

.dropdown-item .icon {
  font-size: 16px;
}

.dropdown-item.logout {
  color: var(--color-danger);
  border-top: 1px solid var(--color-border);
  margin-top: var(--spacing-xs);
  padding-top: var(--spacing-sm);
}

.dropdown-item.logout:hover {
  background-color: #fff5f5;
  color: var(--color-danger);
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Mobile adjustments */
@media (max-width: 768px) {
  .user-name {
    display: none; /* Only show name on desktop if screen is small */
  }
}
</style>

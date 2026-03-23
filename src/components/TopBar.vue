<template>
  <header class="topbar">
    <div class="topbar-content">
      <!-- Hamburger Menu Button -->
      <div class="hamburger-container" ref="hamburgerContainer">
        <button class="hamburger-btn" @click="toggleHamburger" aria-label="Menu">
          <span class="hamburger-icon" :class="{ 'open': showHamburger }"></span>
        </button>

        <!-- Hamburger Drawer -->
        <transition name="slide">
          <div v-if="showHamburger" class="hamburger-drawer card">
            <div class="drawer-header">
              <span class="drawer-title">MediTrack</span>
            </div>
            <nav class="drawer-nav">
              <router-link to="/" class="drawer-item" active-class="active" @click="showHamburger = false">
                <span class="icon">📅</span> Agenda
              </router-link>
              <router-link v-if="!isReadOnly" to="/patients" class="drawer-item" active-class="active" @click="showHamburger = false">
                <span class="icon">👥</span> Pacientes
              </router-link>
              <router-link v-if="!isReadOnly" to="/medicines" class="drawer-item" active-class="active" @click="showHamburger = false">
                <span class="icon">💊</span> Fármacos
              </router-link>
              <router-link to="/reports" class="drawer-item" active-class="active" @click="showHamburger = false">
                <span class="icon">📊</span> Reportes
              </router-link>
              <router-link v-if="isAdmin" to="/users" class="drawer-item" active-class="active" @click="showHamburger = false">
                <span class="icon">⚙️</span> Admin
              </router-link>
            </nav>
            <div class="drawer-footer">
              <button @click="handleSignOut" class="drawer-item logout">
                <span class="icon">🚪</span> Cerrar Sesión
              </button>
            </div>
          </div>
        </transition>
      </div>

      <!-- Right Side: User Menu -->
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
    <!-- Backdrop for hamburger -->
    <transition name="fade">
      <div v-if="showHamburger" class="backdrop" @click="showHamburger = false"></div>
    </transition>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { currentUser, signOut, isAdmin, isReadOnly } = useAuth()

const showMenu = ref(false)
const showHamburger = ref(false)
const menuContainer = ref(null)
const hamburgerContainer = ref(null)

const userInitial = computed(() => {
  if (!currentUser.value?.displayName) return '?'
  return currentUser.value.displayName.charAt(0).toUpperCase()
})

const toggleMenu = () => {
  showMenu.value = !showMenu.value
  if (showMenu.value) showHamburger.value = false
}

const toggleHamburger = () => {
  showHamburger.value = !showHamburger.value
  if (showHamburger.value) showMenu.value = false
}

const handleSignOut = async () => {
  showMenu.value = false
  showHamburger.value = false
  await signOut()
  router.push('/login')
}

const handleClickOutside = (event) => {
  if (menuContainer.value && !menuContainer.value.contains(event.target)) {
    showMenu.value = false
  }
  if (hamburgerContainer.value && !hamburgerContainer.value.contains(event.target)) {
    // We check if the backdrop was clicked (handled by template @click) 
    // or if anything outside the container was clicked.
    // However, since the drawer is inside hamburgerContainer, we only close if not contained.
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
  justify-content: space-between;
  align-items: center;
}

/* Hamburger Menu */
.hamburger-container {
  position: relative;
  display: flex;
  align-items: center;
  height: 100%;
}

.hamburger-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--spacing-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1005;
  border-radius: var(--border-radius-sm);
  transition: background-color 0.2s;
}

.hamburger-btn:hover {
  background-color: var(--color-bg);
}

.hamburger-icon {
  width: 24px;
  height: 2px;
  background-color: var(--color-text);
  position: relative;
  transition: all 0.3s ease-in-out;
}

.hamburger-icon::before,
.hamburger-icon::after {
  content: '';
  width: 24px;
  height: 2px;
  background-color: var(--color-text);
  position: absolute;
  left: 0;
  transition: all 0.3s ease-in-out;
}

.hamburger-icon::before {
  top: -8px;
}

.hamburger-icon::after {
  top: 8px;
}

.hamburger-icon.open {
  background-color: transparent;
}

.hamburger-icon.open::before {
  top: 0;
  transform: rotate(45deg);
}

.hamburger-icon.open::after {
  top: 0;
  transform: rotate(-45deg);
}

.hamburger-drawer {
  position: fixed;
  top: 0;
  left: 0;
  width: 280px;
  height: 100vh;
  background-color: var(--color-surface);
  z-index: 1004;
  display: flex;
  flex-direction: column;
  box-shadow: 4px 0 15px rgba(0,0,0,0.1);
  padding-top: var(--header-height);
}

.drawer-header {
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
  margin-bottom: var(--spacing-sm);
}

.drawer-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}

.drawer-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: var(--spacing-sm);
}

.drawer-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  color: var(--color-text);
  text-decoration: none;
  font-size: var(--font-size-md);
  border-radius: var(--border-radius-md);
  transition: all 0.2s;
}

.drawer-item:hover {
  background-color: var(--color-bg);
  color: var(--color-primary);
  transform: translateX(5px);
}

.drawer-item.active {
  background-color: var(--color-primary-light);
  color: var(--color-primary);
  font-weight: var(--font-weight-medium);
}

.drawer-item .icon {
  font-size: 20px;
}

.drawer-footer {
  padding: var(--spacing-sm);
  border-top: 1px solid var(--color-border);
}

.drawer-item.logout {
  width: 100%;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  color: var(--color-danger);
}

.drawer-item.logout:hover {
  background-color: #fff5f5;
}

.backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0,0,0,0.5);
  z-index: 1003;
}

/* User Menu Styles */
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
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease-out;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}

/* Mobile adjustments */
@media (max-width: 768px) {
  .user-name {
    display: none;
  }
}
</style>

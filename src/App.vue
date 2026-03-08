<template>
  <div class="app-layout">
    <main class="main-content">
      <router-view></router-view>
    </main>
    <NavBar v-if="isAuthenticated" />
    <CustomDialog />
  </div>
</template>

<script setup>
import NavBar from './components/NavBar.vue'
import CustomDialog from './components/CustomDialog.vue'
import { useAuth } from './composables/useAuth'

const { isAuthenticated } = useAuth()
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  background-color: var(--color-bg);
}

.main-content {
  padding-bottom: var(--nav-height); /* Ensure content isn't hidden behind nav */
}
</style>

<template>
  <div class="app-layout">
    <TopBar v-if="isAuthenticated" />
    <main class="main-content" :class="{ 'with-topbar': isAuthenticated }">
      <router-view></router-view>
    </main>
    <CustomDialog />
  </div>
</template>

<script setup>
import TopBar from './components/TopBar.vue'
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
  padding-bottom: var(--spacing-md);
}

.main-content.with-topbar {
  padding-top: var(--header-height);
}
</style>

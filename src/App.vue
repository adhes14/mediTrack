<template>
  <div class="app-layout">
    <main class="main-content">
      <router-view></router-view>
    </main>
    <NavBar />
  </div>
</template>

<script setup>
import NavBar from './components/NavBar.vue'
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

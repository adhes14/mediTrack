<template>
  <Transition name="fade">
    <div v-if="dialog.isVisible.value" class="dialog-overlay" @click="dialog.cancelAction" @keydown.esc="dialog.cancelAction" tabindex="0" ref="overlayRef">
      <div class="dialog-content card" @click.stop>
        <div class="dialog-header">
          <h3 class="dialog-title">
            <span v-if="dialog.type.value === 'confirm'" class="dialog-icon warning">⚠️</span>
            <span v-else class="dialog-icon info">ℹ️</span>
            {{ dialog.title.value }}
          </h3>
        </div>
        <div class="dialog-body">
          <p>{{ dialog.message.value }}</p>
        </div>
        <div class="dialog-footer">
          <button v-if="dialog.type.value === 'confirm'" class="btn btn-secondary" @click="dialog.cancelAction">
            Cancel
          </button>
          <button class="btn btn-primary" :class="{ 'danger-btn': dialog.type.value === 'confirm' }" @click="dialog.confirmAction">
            {{ dialog.type.value === 'confirm' ? 'Confirm' : 'OK' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { nextTick, ref, watch } from 'vue'
import { useDialog } from '../composables/useDialog'

const dialog = useDialog()
const overlayRef = ref(null)

watch(dialog.isVisible, async (newValue) => {
  if (newValue) {
    await nextTick()
    if (overlayRef.value) {
      overlayRef.value.focus()
    }
  }
})
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.dialog-overlay:focus {
  outline: none;
}

.dialog-content {
  width: 90%;
  max-width: 400px;
  background-color: var(--color-surface);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--box-shadow-lg);
  animation: slideUp 0.3s ease-out;
  padding: 0;
  overflow: hidden;
}

.dialog-header {
  padding: var(--spacing-md) var(--spacing-md) 0;
}

.dialog-title {
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--color-text);
  font-size: var(--font-size-lg);
}

.dialog-icon.warning {
  color: var(--color-secondary);
}

.dialog-icon.info {
  color: var(--color-primary);
}

.dialog-body {
  padding: var(--spacing-md);
  color: var(--color-text-light);
  font-size: var(--font-size-base);
  line-height: 1.5;
}

.dialog-footer {
  padding: var(--spacing-md);
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
  background-color: var(--color-bg);
  border-top: 1px solid var(--color-border);
}

.danger-btn {
   background-color: var(--color-danger);
   color: white;
}

.danger-btn:active {
    background-color: darken(var(--color-danger), 10%);
}

/* Animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

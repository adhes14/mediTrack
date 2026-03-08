import { ref, computed } from 'vue'
import { authService } from '../services/AuthService'

// Global state using Vue reactivity
const currentUser = ref(null)
const isAuthReady = ref(false)

export function useAuth() {
  const userRole = computed(() => currentUser.value?.role || 'read_only')
  const isAuthenticated = computed(() => !!currentUser.value)
  
  // Expose role check helpers
  const isAdmin = computed(() => userRole.value === 'admin')
  const isManager = computed(() => userRole.value === 'manager')
  const isAssistant = computed(() => userRole.value === 'assistant')
  const isReadOnly = computed(() => userRole.value === 'read_only')

  /**
   * Initialize auth state listener
   * Should be called once, typically in App.vue
   */
  const initAuth = () => {
    return new Promise((resolve) => {
      authService.onAuthStateChange((user) => {
        currentUser.value = user
        isAuthReady.value = true
        resolve(user)
      })
    })
  }

  const signIn = async () => {
    return await authService.signInWithGoogle()
  }

  const signOut = async () => {
    await authService.signOutUser()
    currentUser.value = null
  }

  return {
    currentUser,
    userRole,
    isAuthenticated,
    isAuthReady,
    isAdmin,
    isManager,
    isAssistant,
    isReadOnly,
    initAuth,
    signIn,
    signOut
  }
}

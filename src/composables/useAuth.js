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
  const isProfileComplete = computed(() => !!(currentUser.value?.displayName && currentUser.value?.phone))
  const isEmailVerified = computed(() => currentUser.value?.emailVerified || false)

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

  const registerEmail = async (email, password, displayName, phone) => {
    return await authService.registerWithEmail(email, password, displayName, phone)
  }

  const signInEmail = async (email, password) => {
    return await authService.signInWithEmail(email, password)
  }

  const resetPassword = async (email) => {
    return await authService.sendPasswordReset(email)
  }

  const signInAndLinkGoogle = async (email, password, pendingCredential) => {
    return await authService.signInAndLinkGoogle(email, password, pendingCredential)
  }

  const getGoogleCredentialFromError = (error) => {
    return authService.getGoogleCredentialFromError(error)
  }

  const updateProfile = async (displayName, phone) => {
    if (!currentUser.value) return
    await authService.updateProfileData(currentUser.value.uid, { displayName, phone })
    currentUser.value = { ...currentUser.value, displayName, phone }
  }

  const signOut = async () => {
    await authService.signOutUser()
    currentUser.value = null
  }

  const refreshCurrentUser = async () => {
    const user = await authService.reloadUserData()
    if (user) {
      // Manually trigger update in reactive state by creating a new shallow copy
      // This helps if the internal listener hasn't fired yet
      currentUser.value = {
        ...currentUser.value,
        emailVerified: user.emailVerified
      }
    }
    return user
  }

  return {
    currentUser,
    userRole,
    isAuthenticated,
    isProfileComplete,
    isAuthReady,
    isAdmin,
    isManager,
    isAssistant,
    isReadOnly,
    isEmailVerified,
    initAuth,
    signIn,
    signInAndLinkGoogle,
    getGoogleCredentialFromError,
    registerEmail,
    signInEmail,
    resetPassword,
    updateProfile,
    refreshCurrentUser,
    signOut
  }
}

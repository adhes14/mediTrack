import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  linkWithCredential,
  sendEmailVerification,
  updatePassword,
  GoogleAuthProvider
} from 'firebase/auth'
import { auth, googleProvider } from './firebase'
import { db } from './firebase'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'

export class AuthService {
  /**
   * Sign in with Google Popup
   */
  async signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const user = result.user

      // Check if user exists in the database
      const userRef = doc(db, 'users', user.uid)
      const userSnap = await getDoc(userRef)

      if (!userSnap.exists()) {
        // Create new user document with UID as document ID
        await setDoc(userRef, {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: 'read_only', // default role
          createdAt: new Date().toISOString()
        })
      } else if (user.photoURL && userSnap.data().photoURL !== user.photoURL) {
        // Update photoURL if the user logs in with Google and it has changed
        await updateDoc(userRef, { photoURL: user.photoURL })
      }

      return user
    } catch (error) {
      if (error.code === 'auth/account-exists-with-different-credential') {
        // This is a known issue when Email Enumeration Protection is OFF or with certain providers.
        // We'll throw the error so the UI can handle the linking flow.
        throw error
      }
      console.error('Error signing in with Google:', error)
      throw error
    }
  }

  /**
   * Register with Email and Password
   */
  async registerWithEmail(email, password, displayName, phone) {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      const user = result.user

      const userRef = doc(db, 'users', user.uid)
      await setDoc(userRef, {
        email: user.email,
        displayName: displayName,
        phone: phone,
        role: 'read_only', // default role
        createdAt: new Date().toISOString()
      })

      // Send email verification to prevent automatic provider overwriting
      try {
        await sendEmailVerification(user)
        console.log('Verification email sent')
      } catch (verifyError) {
        console.error('Error sending verification email:', verifyError)
        // We don't throw here to allow the user to continue, 
        // but they should verify eventually.
      }

      return user
    } catch (error) {
      console.error('Error registering with email:', error)
      throw error
    }
  }

  /**
   * Sign in with Email and Password
   */
  async signInWithEmail(email, password) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      return result.user
    } catch (error) {
      console.error('Error signing in with email:', error)
      throw error
    }
  }

  /**
   * Send Password Reset Email
   */
  async sendPasswordReset(email) {
    const { sendPasswordResetEmail } = await import('firebase/auth')
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error) {
      console.error('Error sending password reset:', error)
      throw error
    }
  }

  /**
   * Sign out the current user
   */
  async signOutUser() {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  /**
   * Setup a listener for auth state changes
   */
  onAuthStateChange(callback) {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch user data including role from database
        const userRef = doc(db, 'users', user.uid)
        const userSnap = await getDoc(userRef)
        const userData = userSnap.exists() ? userSnap.data() : null
        callback({
          uid: user.uid,
          email: user.email,
          emailVerified: user.emailVerified,
          displayName: userData?.displayName || user.displayName,
          phone: userData?.phone || null,
          photoURL: user.photoURL,
          role: userData?.role || 'read_only' // Fallback to read_only
        })
      } else {
        callback(null)
      }
    })
  }

  /**
   * Link Google credential with current Email/Password account
   */
  async linkGoogleWithEmail() {
    if (!auth.currentUser) throw new Error('No hay usuario autenticado')

    try {
      // 1. Re-authenticate or get credential for Google
      const result = await signInWithPopup(auth, googleProvider)
      const credential = GoogleAuthProvider.credentialFromResult(result)

      // 2. Link with current user
      await linkWithCredential(auth.currentUser, credential)

      return auth.currentUser
    } catch (error) {
      console.error('Error linking Google account:', error)
      throw error
    }
  }

  /**
   * Extract Google credential from a conflict error
   */
  getGoogleCredentialFromError(error) {
    if (error.code === 'auth/account-exists-with-different-credential') {
      return GoogleAuthProvider.credentialFromError(error)
    }
    return null
  }

  /**
   * Special method to handle linking when Google login fails due to existing email
   */
  async signInAndLinkGoogle(email, password, pendingCredential) {
    try {
      // 1. Sign in with Email/Password first
      const result = await signInWithEmailAndPassword(auth, email, password)
      const user = result.user

      // 2. Check if email is verified BEFORE linking
      if (!user.emailVerified) {
        // Sign out immediately to stay in a clean state if not verified
        await signOut(auth)
        const error = new Error('Por favor, verifica tu correo electrónico antes de vincular tu cuenta con Google.')
        error.code = 'auth/email-not-verified'
        throw error
      }

      // 3. Link the pending Google credential
      await linkWithCredential(user, pendingCredential)

      return user
    } catch (error) {
      console.error('Error in signInAndLinkGoogle:', error)
      throw error
    }
  }
  /**
   * Update Profile data
   */
  async updateProfileData(uid, data) {
    try {
      const userRef = doc(db, 'users', uid)
      await updateDoc(userRef, data)
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  }

  /**
   * Update the current user's password
   */
  async updateUserPassword(newPassword) {
    if (!auth.currentUser) throw new Error('No hay usuario autenticado')
    try {
      await updatePassword(auth.currentUser, newPassword)
    } catch (error) {
      console.error('Error updating password:', error)
      throw error
    }
  }

  /**
   * Reload current user to check for verification updates
   */
  async reloadUserData() {
    if (auth.currentUser) {
      await auth.currentUser.reload()
      return auth.currentUser
    }
    return null
  }
}

export const authService = new AuthService()

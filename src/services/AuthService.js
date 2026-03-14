import { signInWithPopup, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
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
}

export const authService = new AuthService()

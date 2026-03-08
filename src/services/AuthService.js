import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
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
      }

      return user
    } catch (error) {
      console.error('Error signing in with Google:', error)
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
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: userData?.role || 'read_only' // Fallback to read_only
        })
      } else {
        callback(null)
      }
    })
  }
}

export const authService = new AuthService()

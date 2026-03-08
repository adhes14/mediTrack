import { db } from './firebase'
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where
} from 'firebase/firestore'

export class DatabaseService {
  /**
   * Get all documents from a collection
   */
  async getAll(collectionName) {
    const snapshot = await getDocs(collection(db, collectionName))
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  }

  /**
   * Get a single document by ID
   */
  async getById(collectionName, id) {
    const docRef = doc(db, collectionName, String(id))
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() }
    }
    return null
  }

  /**
   * Add a new document to a collection
   * Returns the new document ID
   */
  async add(collectionName, data) {
    const cleanData = { ...data }
    delete cleanData.id // Don't store the id field inside the document
    const docRef = await addDoc(collection(db, collectionName), cleanData)
    return docRef.id
  }

  /**
   * Update an existing document
   * Data must include an 'id' field
   */
  async update(collectionName, data) {
    const { id, ...updateData } = data
    const docRef = doc(db, collectionName, String(id))
    await updateDoc(docRef, updateData)
    return id
  }

  /**
   * Delete a document by ID
   */
  async delete(collectionName, id) {
    const docRef = doc(db, collectionName, String(id))
    await deleteDoc(docRef)
  }

  /**
   * Query documents by a specific field value
   * Useful for checking CI uniqueness
   */
  async getByField(collectionName, field, value) {
    const q = query(collection(db, collectionName), where(field, '==', value))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  }
}

export const dbService = new DatabaseService()

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  WhereFilterOp
} from "firebase/firestore";
import { db } from "./firebase";

// Collection names
export const COLLECTIONS = {
  BUDGETS: "budgets",
  DEBTS: "debts", 
  GOALS: "goals",
  USERS: "users",
  CUSTOM_CATEGORIES: "customCategories",
  BUDGET_TEMPLATES: "budgetTemplates"
} as const;

// Generic CRUD operations
export const firestoreUtils = {
  // Create
  async create<T>(collectionName: string, data: Omit<T, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  },

  // Read single document
  async get<T>(collectionName: string, id: string): Promise<T | null> {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as T;
    }
    return null;
  },

  // Read all documents
  async getAll<T>(collectionName: string): Promise<T[]> {
    const querySnapshot = await getDocs(collection(db, collectionName));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as T);
  },

  // Read documents with query
  async getWhere<T>(collectionName: string, field: string, operator: WhereFilterOp, value: unknown): Promise<T[]> {
    const q = query(collection(db, collectionName), where(field, operator, value));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as T);
  },

  // Update
  async update<T>(collectionName: string, id: string, data: Partial<T>): Promise<void> {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  },

  // Delete
  async delete(collectionName: string, id: string): Promise<void> {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  },

  // Real-time listener
  subscribe<T>(
    collectionName: string, 
    callback: (data: T[]) => void,
    userId?: string
  ): () => void {
    try {
      const baseQuery = collection(db, collectionName);
      
      if (userId) {
        const q = query(baseQuery, where("userId", "==", userId));
        const unsubscribe = onSnapshot(q, 
          (querySnapshot) => {
            const data = querySnapshot.docs.map(doc => ({ 
              id: doc.id, 
              ...doc.data() 
            })) as T[];
            callback(data);
          },
          (error) => {
            console.error(`Error in ${collectionName} listener:`, error);
          }
        );
        return unsubscribe;
      } else {
        const unsubscribe = onSnapshot(baseQuery, 
          (querySnapshot) => {
            const data = querySnapshot.docs.map(doc => ({ 
              id: doc.id, 
              ...doc.data() 
            })) as T[];
            callback(data);
          },
          (error) => {
            console.error(`Error in ${collectionName} listener:`, error);
          }
        );
        return unsubscribe;
      }
    } catch (error) {
      console.error(`Error setting up ${collectionName} listener:`, error);
      // Return a no-op function if setup fails
      return () => {};
    }
  },

  // Batch operations
  async batchWrite(operations: Array<{
    type: 'create' | 'update' | 'delete';
    collection: string;
    id?: string;
    data?: Record<string, unknown>;
  }>): Promise<void> {
    const batch = writeBatch(db);
    
    operations.forEach(op => {
      if (op.type === 'create') {
        const docRef = doc(collection(db, op.collection));
        batch.set(docRef, {
          ...op.data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else if (op.type === 'update' && op.id) {
        const docRef = doc(db, op.collection, op.id);
        batch.update(docRef, {
          ...op.data,
          updatedAt: serverTimestamp()
        });
      } else if (op.type === 'delete' && op.id) {
        const docRef = doc(db, op.collection, op.id);
        batch.delete(docRef);
      }
    });
    
    await batch.commit();
  }
}; 
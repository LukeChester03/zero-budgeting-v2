// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCHMlB0PGdC_5NPsZVm9hqkDoEg4jVey_E",
  authDomain: "zero-budgeting.firebaseapp.com",
  projectId: "zero-budgeting",
  storageBucket: "zero-budgeting.firebasestorage.app",
  messagingSenderId: "278364472398",
  appId: "1:278364472398:web:e7584bb5dbcf77e53eef1f",
  measurementId: "G-E1ZYQKQW18"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services (these work on both server and client)
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Analytics will be initialized separately on the client side
export let analytics: ReturnType<typeof import('firebase/analytics').getAnalytics> | null = null;

// Initialize Analytics only on client side
if (typeof window !== 'undefined') {
  import('firebase/analytics').then(({ getAnalytics, isSupported }) => {
    isSupported().then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    });
  });
}

export default app; 
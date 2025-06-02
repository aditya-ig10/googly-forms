import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth, GoogleAuthProvider } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyBH9AMHP8O2ewH0GpFdlNWbZVtDxQogFEE",
  authDomain: "googly-3c37d.firebaseapp.com",
  projectId: "googly-3c37d",
  storageBucket: "googly-3c37d.firebasestorage.app",
  messagingSenderId: "415900462447",
  appId: "1:415900462447:web:90464b2c7446c013994c9a",
  measurementId: "G-7YDQ7V7WSF"
};


const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

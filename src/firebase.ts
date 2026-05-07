import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  projectId: "rakshak-22cc1",
  appId: "1:381155363690:web:589a0bc48ea6e620707313",
  storageBucket: "rakshak-22cc1.firebasestorage.app",
  apiKey: "AIzaSyBsbtaMusPX7ho-PMSbg0hlk3MUwg9z1vs",
  authDomain: "rakshak-22cc1.firebaseapp.com",
  messagingSenderId: "381155363690",
  measurementId: "G-JN8085BX7S"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

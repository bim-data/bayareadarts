import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAGMV9F-9cW_kb212fsAv6_G77bH2Ruemc",
  authDomain: "bay-area-darts.firebaseapp.com",
  projectId: "bay-area-darts",
  storageBucket: "bay-area-darts.firebasestorage.app",
  messagingSenderId: "218991945584",
  appId: "1:218991945584:web:b53d7af955f98575aad1b5",
  measurementId: "G-KZN2Y31SSE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Export the database and auth services so your components can use them
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

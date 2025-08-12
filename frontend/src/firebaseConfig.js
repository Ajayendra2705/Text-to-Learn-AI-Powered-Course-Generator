// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// ✅ Your Firebase config from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyBfM0QZeEKa_W5opF_tWTwFon4-xiRLvaQ",
  authDomain: "ai-course-generator-257c5.firebaseapp.com",
  projectId: "ai-course-generator-257c5",
  storageBucket: "ai-course-generator-257c5.firebasestorage.app",
  messagingSenderId: "451861493205",
  appId: "1:451861493205:web:97b874912697a1817bf95c",
  measurementId: "G-S3CQ7ZVFGW"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Initialize Auth & Google Provider (only export what’s needed)
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };

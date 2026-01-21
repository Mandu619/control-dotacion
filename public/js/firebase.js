// public/js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// ✅ Configuración REAL de tu proyecto nuevo (control-diario-9d857)
const firebaseConfig = {
  apiKey: "AIzaSyDWdK0qZtOktsP5QWf232v1Ck_l_qxQZ9E",
  authDomain: "control-diario-9d857.firebaseapp.com",
  projectId: "control-diario-9d857",
  storageBucket: "control-diario-9d857.firebasestorage.app",
  messagingSenderId: "876541632860",
  appId: "1:876541632860:web:d0826336d7a879bfef2199"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

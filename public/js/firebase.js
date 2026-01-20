import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// CONFIGURACIÓN REAL DEL PROYECTO
const firebaseConfig = {
  apiKey: "AIzaSyCLSFST_F8BuCBUFaskoMXoleVAwL3FC2Yk",
  authDomain: "control-diario-dc736.firebaseapp.com",
  projectId: "control-diario-dc736",
  storageBucket: "control-diario-dc736.firebasestorage.app",
  messagingSenderId: "99811680254",
  appId: "1:99811680254:web:347f3eb243a9d4e1032aaf"
};

// Inicializar Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);


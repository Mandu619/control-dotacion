import { auth } from "./firebase_v2.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getUserProfile } from "./api.js";

/**
 * Estructura en GitHub Pages:
 * - /index.html
 * - /public/register.html
 * - /public/dashboard.html
 * - /public/js/gate.js
 *
 * Por eso:
 * - Para volver al login desde /public/* => ../index.html
 * - Para ir al dashboard desde raíz o /public => public/dashboard.html o dashboard.html según donde estés
 */

function isInPublicFolder() {
  return location.pathname.includes("/public/");
}

function goLogin() {
  // Si estoy en /public/* vuelvo un nivel arriba
  location.href = isInPublicFolder() ? "../index.html" : "index.html";
}

function goDashboard() {
  // Si estoy en raíz debo ir a /public/dashboard.html
  // Si estoy ya en /public, basta dashboard.html
  location.href = isInPublicFolder() ? "dashboard.html" : "public/dashboard.html";
}

function currentPage() {
  // "index.html", "register.html", "dashboard.html", etc.
  return (location.pathname.split("/").pop() || "index.html").toLowerCase();
}

onAuthStateChanged(auth, async (u) => {
  const page = currentPage();

  // Páginas "públicas" permitidas sin login:
  const isLoginPage = page === "index.html";
  const isRegisterPage = page === "register.html";

  if (!u) {
    // Si NO hay usuario logueado, solo permite index y register
    if (!isLoginPage && !isRegisterPage) goLogin();
    return;
  }

  // Si está logueado y está en index o register => mándalo al dashboard
  if (isLoginPage || isRegisterPage) {
    goDashboard();
    return;
  }

  // Si está logueado pero no tiene perfil en Firestore => lo saco (evita usuarios sin invitación)
  try {
    const profile = await getUserProfile(u.uid);
    if (!profile) goLogin();
  } catch (err) {
    console.error("gate.js -> getUserProfile error:", err);
    goLogin();
  }
});

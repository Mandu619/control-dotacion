import { auth, db } from "./firebase.js";
import { qs, showMsg, hideMsg } from "./utils.js";
import { auth, db } from "./firebase.js";
import { qs, showMsg, hideMsg } from "./utils.js";
import {
 signInWithEmailAndPassword,
 sendPasswordResetEmail,
 createUserWithEmailAndPassword,
 signOut
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { getInviteByCode, markInviteUsed } from "./api.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getInviteByCode, markInviteUsed } from "./api.js";

/** Detecta si estamos corriendo desde la raíz del repo (GitHub Pages) */
function isRootLoginPage() {
  // Si el pathname termina en "/control-dotacion/" o "/control-dotacion/index.html"
  const p = location.pathname;
  return p.endsWith("/control-dotacion/") || p.endsWith("/control-dotacion/index.html");
}

/** Redirección correcta según dónde esté el HTML */
function goDashboard() {
  // Si estás en index.html en la raíz, dashboard está en /public/
  if (isRootLoginPage()) {
    location.href = "public/dashboard.html";
  } else {
    // Si estás dentro de /public/, dashboard está al mismo nivel
    location.href = "dashboard.html";
  }
}

function goIndex() {
  // Si estás en /public/ y quieres volver a index raíz:
  // (si tu logout está en dashboard dentro de /public/)
  const p = location.pathname;
  if (p.includes("/control-dotacion/public/")) {
    location.href = "../index.html";
  } else {
    location.href = "index.html";
  }
}

function debugError(e) {
  // Armamos un texto útil para UI + consola
  const code = e?.code ? String(e.code) : "sin-code";
  const message = e?.message ? String(e.message) : "sin-message";
  const name = e?.name ? String(e.name) : "sin-name";
  return { code, message, name };
}

function showRealError(msgEl, prefix, e) {
  const { code, message } = debugError(e);
  console.error(prefix, e);
  showMsg(msgEl, `${prefix}\n${code}\n${message}`, "bad");
}

// LOGIN
const loginBtn = qs("btnLogin");
const forgotBtn = qs("btnForgot");
const logoutBtn = qs("btnLogout");

if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    const msg = qs("msg");
    hideMsg(msg);

    const emailEl = qs("email");
    const passEl = qs("password");

    const email = (emailEl?.value || "").trim();
    const pass = passEl?.value || "";

    if (!email || !pass) {
      showMsg(msg, "Debes ingresar correo y contraseña.", "warn");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, pass);
      showMsg(msg, "Ingreso OK. Redirigiendo...", "ok");
      setTimeout(goDashboard, 200);
    } catch (e) {
      // ✅ aquí verás el error real
      showRealError(msg, "No se pudo ingresar (detalle):", e);
    }
  });
}

// RESET PASSWORD
if (forgotBtn) {
  forgotBtn.addEventListener("click", async () => {
    const msg = qs("msg");
    hideMsg(msg);

    const email = (qs("email")?.value || "").trim();
    if (!email) {
      showMsg(msg, "Ingresa tu correo para enviar reset.", "warn");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      showMsg(msg, "Correo de restablecimiento enviado.", "ok");
    } catch (e) {
      // ✅ error real del reset
      showRealError(msg, "No se pudo enviar reset (detalle):", e);
    }
  });
}

// LOGOUT
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      await signOut(auth);
      goIndex();
    } catch (e) {
      console.error("LOGOUT ERROR:", e);
      // Si tienes un msg en dashboard puedes mostrarlo; si no, alert simple:
      const msg = qs("msg");
      if (msg) showRealError(msg, "No se pudo cerrar sesión (detalle):", e);
      else alert("No se pudo cerrar sesión. Revisa consola.");
    }
  });
}

// REGISTER
const regBtn = qs("btnRegister");

if (regBtn) {
  regBtn.addEventListener("click", async () => {
    const msg = qs("msg");
    hideMsg(msg);

    const code = (qs("inviteCode")?.value || "").trim().toUpperCase();
    const email = (qs("email")?.value || "").trim();
    const pass = qs("password")?.value || "";

    if (!code || !email || !pass) {
      showMsg(msg, "Debes completar código, correo y contraseña.", "warn");
      return;
    }
    if (pass.length < 6) {
      showMsg(msg, "La contraseña debe tener al menos 6 caracteres.", "warn");
      return;
    }

    try {
      // 1) validar invitación ANTES de crear cuenta
      const inv = await getInviteByCode(code);

      if (!inv) {
        showMsg(msg, "Código inválido.", "bad");
        return;
      }
      if (inv.used) {
        showMsg(msg, "Este código ya fue utilizado.", "bad");
        return;
      }
      if ((inv.email || "").toLowerCase() !== email.toLowerCase()) {
        showMsg(msg, "El correo no coincide con la invitación.", "bad");
        return;
      }

      // 2) crear usuario Auth
      const cred = await createUserWithEmailAndPassword(auth, email, pass);

      // 3) crear perfil en /users/{uid}
      await setDoc(doc(db, "users", cred.user.uid), {
        email,
        role: inv.role,
        unidadId: inv.role === "operador" ? (inv.unidadId || null) : null,
        createdAt: Date.now()
      });

      // 4) marcar invitación usada
      await markInviteUsed(code, cred.user.uid);

      showMsg(msg, "Registro OK. Entrando...", "ok");
      setTimeout(goDashboard, 400);

    } catch (e) {
      // ✅ error real del registro
      showRealError(msg, "No se pudo registrar (detalle):", e);
    }
  });
}


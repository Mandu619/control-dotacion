import { auth, db } from "./firebase_v2.js";
import { qs, showMsg, hideMsg } from "./utils.js";

import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

import { getInviteByCode, markInviteUsed } from "./api.js";

/* =========================
  Helpers de debug
========================= */
function prettyAuthError(e) {
  const code = e?.code || "(sin code)";
  const name = e?.name || "(sin name)";
  const msg = e?.message || "(sin message)";
  const customData = e?.customData ? JSON.stringify(e.customData) : "";
  return [
    `code: ${code}`,
    `name: ${name}`,
    `message: ${msg}`,
    customData ? `customData: ${customData}` : ""
  ].filter(Boolean).join("\n");
}

function detailMsg(e) {
  const code = e?.code ? String(e.code) : "";
  const msg = e?.message ? String(e.message) : String(e);
  return code ? `${code}: ${msg}` : msg;
}

window.addEventListener("error", (ev) => {
  console.error("window.error:", ev.error || ev.message, ev);
});
window.addEventListener("unhandledrejection", (ev) => {
  console.error("unhandledrejection:", ev.reason);
});

/* =========================
  LOGIN
========================= */
const loginBtn = qs("btnLogin");
const forgotBtn = qs("btnForgot");
const logoutBtn = qs("btnLogout");

if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    const msgBox = qs("msg");
    hideMsg(msgBox);

    const email = (qs("email") ? qs("email").value : "").trim();
    const pass = (qs("password") ? qs("password").value : "");

    if (!email || !pass) {
      showMsg(msgBox, "Debes ingresar correo y contraseña.", "warn");
      return;
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);

      // ✅ BOOTSTRAP ADMIN (solo tu correo)
      const ADMIN_EMAILS = ["mandujanooo619@gmail.com"];
      const userEmail = (cred.user.email || "").toLowerCase();
      const isBootstrapAdmin = ADMIN_EMAILS.includes(userEmail);

      if (isBootstrapAdmin) {
        const ref = doc(db, "users", cred.user.uid);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          await setDoc(ref, {
            email: cred.user.email,
            role: "admin",
            unidadId: null,
            createdAt: Date.now()
          });
        } else {
          await setDoc(ref, { role: "admin", unidadId: null }, { merge: true });
        }
      }

      // ✅ OJO: desde index.html (raíz) hacia /public/dashboard.html
      location.href = "public/dashboard.html";

    } catch (e) {
      console.error("LOGIN ERROR FULL =>", e);
      showMsg(msgBox, "ERROR EXACTO:\n" + prettyAuthError(e), "bad");
    }
  });
}

/* =========================
  FORGOT PASSWORD
========================= */
if (forgotBtn) {
  forgotBtn.addEventListener("click", async () => {
    const msgBox = qs("msg");
    hideMsg(msgBox);

    const email = (qs("email") ? qs("email").value : "").trim();
    if (!email) {
      showMsg(msgBox, "Ingresa tu correo para enviar reset.", "warn");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      showMsg(msgBox, "Correo de restablecimiento enviado.", "ok");
    } catch (e) {
      console.error("RESET ERROR:", e);
      showMsg(msgBox, "No se pudo enviar reset: " + detailMsg(e), "bad");
    }
  });
}

/* =========================
  LOGOUT (si estás en /public/dashboard.html)
========================= */
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    location.href = "../index.html";
  });
}

/* =========================
  REGISTER (public/register.html)
========================= */
const regBtn = qs("btnRegister");
if (regBtn) {
  regBtn.addEventListener("click", async () => {
    const msgBox = qs("msg");
    hideMsg(msgBox);

    const code = (qs("inviteCode") ? qs("inviteCode").value : "").trim().toUpperCase();
    const email = (qs("email") ? qs("email").value : "").trim();
    const pass = (qs("password") ? qs("password").value : "");

    if (!code || !email || !pass) {
      showMsg(msgBox, "Debes completar código, correo y contraseña.", "warn");
      return;
    }
    if (pass.length < 6) {
      showMsg(msgBox, "La contraseña debe tener al menos 6 caracteres.", "warn");
      return;
    }

    let inv;
    try {
      inv = await getInviteByCode(code);
    } catch (e) {
      console.error("INVITE READ ERROR:", e);
      showMsg(msgBox, "No se pudo validar invitación: " + detailMsg(e), "bad");
      return;
    }

    if (!inv) return showMsg(msgBox, "Código inválido.", "bad");
    if (inv.used) return showMsg(msgBox, "Este código ya fue utilizado.", "bad");
    if ((inv.email || "").toLowerCase() !== email.toLowerCase()) {
      return showMsg(msgBox, "El correo no coincide con la invitación.", "bad");
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);

      await setDoc(doc(db, "users", cred.user.uid), {
        email,
        role: inv.role,
        unidadId: inv.role === "operador" ? (inv.unidadId || null) : null,
        createdAt: Date.now()
      });

      await markInviteUsed(code, cred.user.uid);

      showMsg(msgBox, "Registro OK. Entrando...", "ok");

      // ✅ register.html está en /public, entonces dashboard.html está al lado
      setTimeout(() => (location.href = "dashboard.html"), 600);

    } catch (e) {
      console.error("REGISTER ERROR:", e);
      showMsg(msgBox, "No se pudo registrar: " + detailMsg(e), "bad");
    }
  });
}


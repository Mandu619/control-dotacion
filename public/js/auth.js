import { auth, db } from "./firebase.js";
import { qs, showMsg, hideMsg } from "./utils.js";
import {
 signInWithEmailAndPassword,
 sendPasswordResetEmail,
 createUserWithEmailAndPassword,
 signOut
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getInviteByCode, markInviteUsed } from "./api.js";

function prettyAuthError(e) {
 const code = e?.code || "(sin code)";
 const msg = e?.message || "(sin message)";
 // Firebase suele traer info extra en estas propiedades
 const customData = e?.customData ? JSON.stringify(e.customData) : "";
 const name = e?.name || "";
 // A veces viene un error interno anidado
 const inner = e?.cause ? JSON.stringify(e.cause) : "";
 // Intenta detectar respuestas internas (no siempre existe)
 const resp = e?.customData?._tokenResponse
   ? JSON.stringify(e.customData._tokenResponse)
   : "";
 return [
   `code: ${code}`,
   `name: ${name}`,
   `message: ${msg}`,
   customData ? `customData: ${customData}` : "",
   resp ? `tokenResponse: ${resp}` : "",
   inner ? `cause: ${inner}` : ""
 ].filter(Boolean).join("\n");
}
/* =========================
  Helpers de debug
========================= */
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
 console.log("✅ btnLogin encontrado");
 loginBtn.addEventListener("click", async () => {
   console.log("👉 click btnLogin");
   const msg = qs("msg");
   hideMsg(msg);
   const emailEl = qs("email");
   const passEl = qs("password");
   const email = (emailEl ? emailEl.value : "").trim();
   const pass = passEl ? passEl.value : "";
   if (!email || !pass) {
     showMsg(msg, "Debes ingresar correo y contraseña.", "warn");
     return;
   }
  try {
 await signInWithEmailAndPassword(auth, email, pass);
 location.href = "dashboard.html";
} catch (e) {
 console.error("LOGIN ERROR FULL =>", e);
 // Muestra el detalle exacto en pantalla
 showMsg(msg, "ERROR EXACTO:\n" + prettyAuthError(e), "bad");
}
 });
} else {
 console.warn("⚠️ btnLogin NO encontrado en esta página");
}
if (forgotBtn) {
 forgotBtn.addEventListener("click", async () => {
   const msg = qs("msg");
   hideMsg(msg);
   const email = (qs("email") ? qs("email").value : "").trim();
   if (!email) {
     showMsg(msg, "Ingresa tu correo para enviar reset.", "warn");
     return;
   }
   try {
     await sendPasswordResetEmail(auth, email);
     showMsg(msg, "Correo de restablecimiento enviado.", "ok");
   } catch (e) {
     console.error("RESET ERROR:", e);
     showMsg(msg, "No se pudo enviar reset: " + detailMsg(e), "bad");
   }
 });
}
if (logoutBtn) {
 logoutBtn.addEventListener("click", async () => {
   await signOut(auth);
   location.href = "index.html";
 });
}
/* =========================
  REGISTER
========================= */
const regBtn = qs("btnRegister");
if (regBtn) {
 regBtn.addEventListener("click", async () => {
   const msg = qs("msg");
   hideMsg(msg);
   const code = (qs("inviteCode") ? qs("inviteCode").value : "").trim().toUpperCase();
   const email = (qs("email") ? qs("email").value : "").trim();
   const pass = qs("password") ? qs("password").value : "";
   if (!code || !email || !pass) {
     showMsg(msg, "Debes completar código, correo y contraseña.", "warn");
     return;
   }
   if (pass.length < 6) {
     showMsg(msg, "La contraseña debe tener al menos 6 caracteres.", "warn");
     return;
   }
   // 1) validar invitación antes de crear cuenta
   let inv;
   try {
     inv = await getInviteByCode(code);
   } catch (e) {
     console.error("INVITE READ ERROR:", e);
     showMsg(msg, "No se pudo validar invitación: " + detailMsg(e), "bad");
     return;
   }
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
   try {
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
     setTimeout(() => (location.href = "dashboard.html"), 600);
   } catch (e) {
     console.error("REGISTER ERROR:", e);
     showMsg(msg, "No se pudo registrar: " + detailMsg(e), "bad");
   }
 });
}

window.addEventListener("unhandledrejection", (ev) => {
 console.error("UNHANDLED PROMISE:", ev.reason);
});
window.addEventListener("error", (ev) => {
 console.error("WINDOW ERROR:", ev.error || ev.message);
});



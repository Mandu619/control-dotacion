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

// LOGIN
const loginBtn = qs("btnLogin");
const forgotBtn = qs("btnForgot");
const logoutBtn = qs("btnLogout");

if (loginBtn){
  loginBtn.addEventListener("click", async ()=>{
    const msg = qs("msg"); hideMsg(msg);
    const email = qs("email").value.trim();
    const pass = qs("password").value;
    if(!email || !pass){ showMsg(msg,"Debes ingresar correo y contraseña.","warn"); return; }
    try{
      await signInWithEmailAndPassword(auth, email, pass);
      location.href = "dashboard.html";
    }catch(e){
      showMsg(msg,"No se pudo ingresar. Revisa credenciales.","bad");
    }
  });
}

if (forgotBtn){
  forgotBtn.addEventListener("click", async ()=>{
    const msg = qs("msg"); hideMsg(msg);
    const email = qs("email").value.trim();
    if(!email){ showMsg(msg,"Ingresa tu correo para enviar reset.","warn"); return; }
    try{
      await sendPasswordResetEmail(auth, email);
      showMsg(msg,"Correo de restablecimiento enviado.","ok");
    }catch(e){
      showMsg(msg,"No se pudo enviar reset (revisa el correo).","bad");
    }
  });
}

if (logoutBtn){
  logoutBtn.addEventListener("click", async ()=>{
    await signOut(auth);
    location.href = "index.html";
  });
}

// REGISTER
const regBtn = qs("btnRegister");
if (regBtn){
  regBtn.addEventListener("click", async ()=>{
    const msg = qs("msg"); hideMsg(msg);

    const code = qs("inviteCode").value.trim().toUpperCase();
    const email = qs("email").value.trim();
    const pass = qs("password").value;

    if(!code || !email || !pass){
      showMsg(msg,"Debes completar código, correo y contraseña.","warn"); return;
    }
    if(pass.length < 6){
      showMsg(msg,"La contraseña debe tener al menos 6 caracteres.","warn"); return;
    }

    // 1) validar invitación ANTES de crear cuenta
    const inv = await getInviteByCode(code);
    if(!inv){
      showMsg(msg,"Código inválido.","bad"); return;
    }
    if(inv.used){
      showMsg(msg,"Este código ya fue utilizado.","bad"); return;
    }
    if((inv.email || "").toLowerCase() !== email.toLowerCase()){
      showMsg(msg,"El correo no coincide con la invitación.","bad"); return;
    }

    try{
      // 2) crear usuario Auth
      const cred = await createUserWithEmailAndPassword(auth, email, pass);

      // 3) crear perfil en /users/{uid}
      await setDoc(doc(db,"users",cred.user.uid), {
        email,
        role: inv.role,
        unidadId: inv.role === "operador" ? (inv.unidadId || null) : null,
        createdAt: Date.now()
      });

      // 4) marcar invitación usada
      await markInviteUsed(code, cred.user.uid);

      showMsg(msg,"Registro OK. Entrando...","ok");
      setTimeout(()=>location.href="dashboard.html", 600);

    }catch(e){
      showMsg(msg,"No se pudo registrar (correo ya usado o error).","bad");
    }
  });
}

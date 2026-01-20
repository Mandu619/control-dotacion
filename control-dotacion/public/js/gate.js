import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getUserProfile } from "./api.js";

onAuthStateChanged(auth, async (u)=>{
  const page = location.pathname.split("/").pop() || "index.html";

  if (!u){
    if (page !== "index.html" && page !== "register.html") location.href="index.html";
    return;
  }

  // si está logueado y está en index/register, llévalo al dashboard
  if (page === "index.html" || page === "register.html"){
    location.href = "dashboard.html";
    return;
  }

  // si no tiene perfil, lo sacamos (evita usuarios sin invitación)
  const profile = await getUserProfile(u.uid);
  if(!profile){
    location.href="index.html";
  }
});

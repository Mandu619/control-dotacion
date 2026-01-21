import { auth } from "./firebase_v2.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getUserProfile } from "./api.js";
import { qs } from "./utils.js";

onAuthStateChanged(auth, async (u)=>{
  if(!u) return;

  const profile = await getUserProfile(u.uid);
  qs("who").textContent = `${profile.role.toUpperCase()} • ${profile.email || u.email}`;

  if(profile.role === "admin"){
    const mod = await import("./admin.js");
    mod.renderAdmin(profile);
  } else if(profile.role === "encargado"){
    const mod = await import("./encargado.js");
    mod.renderEncargado(profile);
  } else {
    const mod = await import("./operador.js");
    mod.renderOperador(profile);
  }
});


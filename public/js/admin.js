import { qs, showMsg, hideMsg, randomInviteCode } from "./utils.js";
import { card, btn, hr } from "./ui.js";
import {
  listUnits, createUnit, updateUnit, deleteUnit,
  listPersonnelByUnit, createPerson, updatePerson, deletePerson,
  createInvite
} from "./api.js";

export async function renderAdmin(profile){
  const main = qs("main");
  main.innerHTML = "";

  // ---- UNITS ----
  const cUnits = card("Admin • Unidades/Cursos");
  const msg1 = document.createElement("div");
  msg1.className="msg"; msg1.style.display="none";
  cUnits.appendChild(msg1);

  const unitsList = document.createElement("div");
  unitsList.className="list";
  cUnits.appendChild(unitsList);

  const addUnit = document.createElement("div");
  addUnit.className="item";
  addUnit.innerHTML = `
    <b>Crear nueva unidad/curso</b>
    <label>Nombre</label><input id="u_name" placeholder="Ej: Curso A / Unidad X" />
    <label>Tipo</label>
    <select id="u_tipo">
      <option value="unidad">unidad</option>
      <option value="curso">curso</option>
    </select>
  `;
  const bAddUnit = btn("Crear", "btn good small");
  bAddUnit.style.marginTop="10px";
  addUnit.appendChild(bAddUnit);

  cUnits.appendChild(hr());
  cUnits.appendChild(addUnit);

  // ---- PERSONNEL ----
  const cPers = card("Admin • Personal");
  const msg2 = document.createElement("div");
  msg2.className="msg"; msg2.style.display="none";
  cPers.appendChild(msg2);

  const selUnit = document.createElement("select");
  cPers.appendChild(selUnit);

  const persList = document.createElement("div");
  persList.className="list";
  persList.style.marginTop="12px";
  cPers.appendChild(persList);

  const addPers = document.createElement("div");
  addPers.className="item";
  addPers.innerHTML = `
    <b>Agregar personal</b>
    <label>Grado</label><input id="p_grado" placeholder="Ej: Alumno / Cabo / Sgto" />
    <label>Nombre</label><input id="p_nombre" placeholder="Nombre y Apellido" />
  `;
  const bAddPers = btn("Agregar", "btn good small");
  bAddPers.style.marginTop="10px";
  addPers.appendChild(bAddPers);

  cPers.appendChild(hr());
  cPers.appendChild(addPers);

  // ---- INVITES ----
  const cInv = card("Admin • Invitaciones (para registro)");
  const msg3 = document.createElement("div");
  msg3.className="msg"; msg3.style.display="none";
  cInv.appendChild(msg3);

  const invBox = document.createElement("div");
  invBox.className="item";
  invBox.innerHTML = `
    <b>Crear invitación</b>
    <label>Correo del usuario</label>
    <input id="inv_email" type="email" placeholder="correo@dominio.cl" />
    <label>Rol</label>
    <select id="inv_role">
      <option value="operador">operador</option>
      <option value="encargado">encargado</option>
      <option value="admin">admin</option>
    </select>
    <label>Unidad/curso (solo operador)</label>
    <select id="inv_unit"></select>
    <label>Código (auto)</label>
    <input id="inv_code" readonly />
  `;
  const bGen = btn("Generar nuevo código", "btn secondary small");
  const bCreate = btn("Crear invitación", "btn good small");
  bGen.style.marginTop="10px";
  bCreate.style.marginTop="10px";

  invBox.appendChild(bGen);
  invBox.appendChild(bCreate);
  cInv.appendChild(invBox);

  // Reset password (correo)
  const resetBox = document.createElement("div");
  resetBox.className="item";
  resetBox.style.marginTop="12px";
  resetBox.innerHTML = `
    <b>Restablecer contraseña (envía correo)</b>
    <label>Correo del usuario</label>
    <input id="rstEmail" type="email" placeholder="correo@dominio.cl" />
  `;
  const bReset = btn("Enviar correo de reset", "btn secondary small");
  bReset.style.marginTop="10px";
  resetBox.appendChild(bReset);
  cInv.appendChild(resetBox);

  // Append
  main.appendChild(cUnits);
  main.appendChild(cPers);
  main.appendChild(cInv);

  // ---- Helpers ----
  function setCode(){
    invBox.querySelector("#inv_code").value = randomInviteCode();
  }

  async function loadUnits(){
    const units = await listUnits();

    // Units list render
    unitsList.innerHTML="";
    selUnit.innerHTML="";
    const invUnitSel = invBox.querySelector("#inv_unit");
    invUnitSel.innerHTML="";

    units.forEach(u=>{
      const o1=document.createElement("option");
      o1.value=u.id; o1.textContent=`${u.nombre} (${u.tipo})`;
      selUnit.appendChild(o1);

      const o2=document.createElement("option");
      o2.value=u.id; o2.textContent=`${u.nombre} (${u.tipo})`;
      invUnitSel.appendChild(o2);

      // render card
      const box=document.createElement("div");
      box.className="item";
      const name=document.createElement("input"); name.value=u.nombre;
      const tipo=document.createElement("select");
      ["unidad","curso"].forEach(t=>{
        const opt=document.createElement("option");
        opt.value=t; opt.textContent=t;
        tipo.appendChild(opt);
      });
      tipo.value=u.tipo;

      const bSave=btn("Guardar","btn small secondary");
      const bDel=btn("Eliminar","btn small danger");

      bSave.onclick=async()=>{
        await updateUnit(u.id,{nombre:name.value.trim(), tipo:tipo.value});
        showMsg(msg1,"Unidad/curso actualizado.","ok");
        await loadUnits();
      };
      bDel.onclick=async()=>{
        await deleteUnit(u.id);
        showMsg(msg1,"Unidad/curso eliminado.","warn");
        await loadUnits();
      };

      box.innerHTML=`<b>Unidad/Curso</b> <span class="tag">${u.tipo}</span>`;
      box.appendChild(document.createElement("div")).style.marginTop="10px";
      box.appendChild(name);
      box.appendChild(tipo);

      const r=document.createElement("div");
      r.className="row"; r.style.marginTop="10px";
      r.appendChild(bSave); r.appendChild(bDel);
      box.appendChild(r);

      unitsList.appendChild(box);
    });

    if(units.length) await loadPersonnel(selUnit.value);
  }

  async function loadPersonnel(unitId){
    persList.innerHTML="";
    const people = await listPersonnelByUnit(unitId);

    people.forEach(p=>{
      const box=document.createElement("div");
      box.className="item";

      const grado=document.createElement("input");
      grado.value=p.grado||"";
      const nombre=document.createElement("input");
      nombre.value=p.nombre||"";

      const bSave=btn("Guardar","btn small secondary");
      const bDel=btn("Eliminar","btn small danger");

      bSave.onclick=async()=>{
        await updatePerson(p.id,{grado:grado.value.trim(), nombre:nombre.value.trim()});
        showMsg(msg2,"Personal actualizado.","ok");
        await loadPersonnel(unitId);
      };
      bDel.onclick=async()=>{
        await deletePerson(p.id);
        showMsg(msg2,"Personal eliminado.","warn");
        await loadPersonnel(unitId);
      };

      box.innerHTML="<b>Personal</b>";
      box.appendChild(grado);
      box.appendChild(nombre);

      const r=document.createElement("div");
      r.className="row"; r.style.marginTop="10px";
      r.appendChild(bSave); r.appendChild(bDel);
      box.appendChild(r);

      persList.appendChild(box);
    });
  }

  // Units create
  bAddUnit.onclick = async ()=>{
    hideMsg(msg1);
    const name = addUnit.querySelector("#u_name").value.trim();
    const tipo = addUnit.querySelector("#u_tipo").value;
    if(!name){ showMsg(msg1,"Nombre requerido.","warn"); return; }
    await createUnit({nombre:name, tipo});
    addUnit.querySelector("#u_name").value="";
    showMsg(msg1,"Unidad/curso creado.","ok");
    await loadUnits();
  };

  selUnit.addEventListener("change", ()=>loadPersonnel(selUnit.value));

  // Personnel create
  bAddPers.onclick = async ()=>{
    hideMsg(msg2);
    const unitId = selUnit.value;
    const grado = addPers.querySelector("#p_grado").value.trim();
    const nombre = addPers.querySelector("#p_nombre").value.trim();
    if(!nombre){ showMsg(msg2,"Nombre requerido.","warn"); return; }
    await createPerson({unitId, grado, nombre});
    addPers.querySelector("#p_grado").value="";
    addPers.querySelector("#p_nombre").value="";
    showMsg(msg2,"Personal agregado.","ok");
    await loadPersonnel(unitId);
  };

  // Invites
  setCode();
  bGen.onclick = ()=>setCode();

  bCreate.onclick = async ()=>{
    hideMsg(msg3);
    const email = invBox.querySelector("#inv_email").value.trim().toLowerCase();
    const role = invBox.querySelector("#inv_role").value;
    const unidadId = invBox.querySelector("#inv_unit").value;
    const code = invBox.querySelector("#inv_code").value.trim().toUpperCase();

    if(!email){ showMsg(msg3,"Correo requerido.","warn"); return; }
    if(!code){ showMsg(msg3,"Código inválido.","warn"); return; }

    await createInvite(code, {
      email,
      role,
      unidadId: role === "operador" ? unidadId : null,
      used:false,
      createdAt: Date.now()
    });

    showMsg(msg3,`Invitación creada. Código: ${code} (se lo entregas al usuario).`,"ok");
    invBox.querySelector("#inv_email").value="";
    setCode();
  };

  // Reset password email
  bReset.onclick = async ()=>{
    const { auth } = await import("./firebase.js");
    const { sendPasswordResetEmail } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js");
    const email = resetBox.querySelector("#rstEmail").value.trim();
    if(!email){ showMsg(msg3,"Ingresa correo a resetear.","warn"); return; }
    try{
      await sendPasswordResetEmail(auth, email);
      showMsg(msg3,"Correo de restablecimiento enviado.","ok");
    }catch(e){
      showMsg(msg3,"No se pudo enviar el correo de reset.","bad");
    }
  };

  await loadUnits();
}

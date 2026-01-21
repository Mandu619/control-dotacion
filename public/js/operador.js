import { auth } from "./firebase_v2.js";
import { card, btn } from "./ui.js";
import { qs, todayISO, isFuture, showMsg, hideMsg } from "./utils.js";
import { listPersonnelByUnit, getReport, createEmptyReport, saveReport, lockReport } from "./api.js";

export async function renderOperador(profile){
  const main = qs("main");
  main.innerHTML = "";

  const c = card("Parte de Fuerza (Operador)");
  const msg = document.createElement("div");
  msg.className="msg"; msg.style.display="none";
  c.appendChild(msg);

  const fechaRow = document.createElement("div");
  fechaRow.className="row";

  const fecha = document.createElement("input");
  fecha.type="date";
  fecha.value=todayISO();
  fecha.max=todayISO(); // nunca futuro

  const info = document.createElement("div");
  info.className="badge";
  info.textContent="Solo puedes publicar el día actual";

  fechaRow.appendChild(fecha);
  fechaRow.appendChild(info);
  c.appendChild(fechaRow);

  const list = document.createElement("div");
  list.className="list";
  list.style.marginTop="12px";
  c.appendChild(list);

  const actionRow = document.createElement("div");
  actionRow.className="row";
  actionRow.style.marginTop="12px";

  const bSave = btn("Guardar (sin publicar)", "btn secondary");
  const bPub = btn("Publicar parte", "btn good");
  actionRow.appendChild(bSave);
  actionRow.appendChild(bPub);
  c.appendChild(actionRow);

  main.appendChild(c);

  const unitId = profile.unidadId;
  if(!unitId){
    showMsg(msg,"No tienes unidad/curso asignado. Pide al admin que te asigne.","warn");
    return;
  }

  let report=null;
  let personnel=[];
  let draft=[];

  async function load(){
    hideMsg(msg);
    list.innerHTML="";

    const dateISO = fecha.value;
    if(isFuture(dateISO)){
      showMsg(msg,"No puedes trabajar con fechas futuras.","warn");
      return;
    }
    if(dateISO !== todayISO()){
      showMsg(msg,"Solo puedes preparar/publicar el parte del día actual.","warn");
      return;
    }

    personnel = await listPersonnelByUnit(unitId);
    report = await getReport(unitId, dateISO);

    if(!report){
      await createEmptyReport({unitId, fechaISO:dateISO, uid:auth.currentUser.uid});
      report = await getReport(unitId, dateISO);
    }

    if(report.publicado && !report.editable){
      showMsg(msg,"Parte publicado y bloqueado. Solo Encargado/Admin puede reabrirlo.","warn");
    }

    const map = new Map((report.registros||[]).map(r=>[r.personId, r]));
    draft = personnel.map(p=>{
      const ex = map.get(p.id);
      return ex ? {...ex} : { personId:p.id, estado:"PRESENTE", motivo:"" };
    });

    personnel.forEach(p=>{
      const box = document.createElement("div");
      box.className="item";

      const top = document.createElement("div");
      top.className="row";

      const left = document.createElement("div");
      left.innerHTML = `<b>${p.grado||""}</b> ${p.nombre||""}`;

      const sel = document.createElement("select");
      ["PRESENTE","AUSENTE","COMISION","LICENCIA","PERMISO","OTRO"].forEach(x=>{
        const o=document.createElement("option"); o.value=x; o.textContent=x;
        sel.appendChild(o);
      });

      const item = draft.find(d=>d.personId===p.id);
      sel.value = item.estado || "PRESENTE";

      const motivo = document.createElement("input");
      motivo.placeholder="Motivo / detalle (si aplica)";
      motivo.value = item.motivo || "";

      sel.addEventListener("change", ()=>{
        draft.find(x=>x.personId===p.id).estado = sel.value;
      });
      motivo.addEventListener("input", ()=>{
        draft.find(x=>x.personId===p.id).motivo = motivo.value;
      });

      top.appendChild(left);
      top.appendChild(sel);

      box.appendChild(top);
      box.appendChild(motivo);

      list.appendChild(box);
    });
  }

  fecha.addEventListener("change", load);

  bSave.onclick = async ()=>{
    hideMsg(msg);
    if(report.publicado && !report.editable){
      showMsg(msg,"Bloqueado: no puedes guardar cambios. Pide reapertura.","warn");
      return;
    }
    await saveReport(report.id, { registros:draft });
    showMsg(msg,"Guardado ok (aún no publicado).","ok");
  };

  bPub.onclick = async ()=>{
    hideMsg(msg);
    if(fecha.value !== todayISO()){
      showMsg(msg,"Solo puedes publicar el día actual.","warn");
      return;
    }
    if(report.publicado && !report.editable){
      showMsg(msg,"Bloqueado: no puedes publicar. Pide reapertura.","warn");
      return;
    }
    await saveReport(report.id, { registros:draft });
    await lockReport(report.id);
    showMsg(msg,"Parte publicado y bloqueado.","ok");
    report = await getReport(unitId, todayISO());
  };

  await load();
}


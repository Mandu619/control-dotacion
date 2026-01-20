import { qs, todayISO, showMsg, hideMsg } from "./utils.js";
import { card, btn } from "./ui.js";
import { listUnits, listReportsByDate, reopenReport } from "./api.js";

export async function renderEncargado(profile){
  const main = qs("main");
  main.innerHTML = "";

  const c = card("Encargado • Resumen de Partes");
  const msg = document.createElement("div");
  msg.className="msg"; msg.style.display="none";
  c.appendChild(msg);

  const row = document.createElement("div");
  row.className="row";
  const fecha = document.createElement("input");
  fecha.type="date"; fecha.value=todayISO();
  row.appendChild(fecha);
  c.appendChild(row);

  const list = document.createElement("div");
  list.className="list";
  list.style.marginTop="12px";
  c.appendChild(list);

  // reset password (dispara correo)
  c.appendChild(document.createElement("hr"));
  const resetBox = document.createElement("div");
  resetBox.className="item";
  resetBox.innerHTML = `
    <b>Restablecer contraseña (envía correo)</b>
    <label>Correo del usuario</label>
    <input id="rstEmail" type="email" placeholder="correo@dominio.cl" />
  `;
  const bReset = btn("Enviar correo de reset", "btn secondary small");
  bReset.style.marginTop="10px";
  resetBox.appendChild(bReset);
  c.appendChild(resetBox);

  main.appendChild(c);

  bReset.onclick = async ()=>{
    const { auth } = await import("./firebase.js");
    const { sendPasswordResetEmail } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js");
    const email = resetBox.querySelector("#rstEmail").value.trim();
    if(!email){ showMsg(msg,"Ingresa correo a resetear.","warn"); return; }
    try{
      await sendPasswordResetEmail(auth, email);
      showMsg(msg,"Correo de restablecimiento enviado.","ok");
    }catch(e){
      showMsg(msg,"No se pudo enviar el correo de reset.","bad");
    }
  };

  async function load(){
    hideMsg(msg);
    list.innerHTML="";

    const units = await listUnits();
    const reports = await listReportsByDate(fecha.value);
    const map = new Map(reports.map(r=>[r.unitId, r]));

    let publicados=0, faltantes=0;

    units.forEach(u=>{
      const r = map.get(u.id);

      const box = document.createElement("div");
      box.className="item";

      const state = document.createElement("span");
      state.className = "tag " + (r?.publicado ? "ok" : "warn");
      state.textContent = r?.publicado ? "PUBLICADO" : "FALTANTE";

      const editable = document.createElement("span");
      editable.className = "tag";
      editable.style.marginLeft="8px";
      editable.textContent = r ? (r.editable ? "EDITABLE" : "BLOQUEADO") : "SIN REGISTRO";

      box.innerHTML = `<b>${u.nombre}</b> <span class="tag">${u.tipo}</span><div style="margin-top:6px"></div>`;
      box.appendChild(state);
      box.appendChild(editable);

      if(r?.publicado && !r.editable){
        const b = btn("Reabrir para corrección", "btn small secondary");
        b.style.marginTop="10px";
        b.onclick = async ()=>{
          await reopenReport(r.id);
          showMsg(msg,`Reabierto: ${u.nombre}. El operador puede corregir y republicar.`,"ok");
          await load();
        };
        box.appendChild(document.createElement("div")).style.marginTop="8px";
        box.appendChild(b);
      }

      list.appendChild(box);
      if(r?.publicado) publicados++; else faltantes++;
    });

    showMsg(msg,`Fecha ${fecha.value}: Publicados ${publicados} • Faltantes ${faltantes}`,"ok");
  }

  fecha.addEventListener("change", load);
  await load();
}

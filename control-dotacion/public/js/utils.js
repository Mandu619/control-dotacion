export function qs(id){ return document.getElementById(id); }

export function showMsg(el, text, type=""){
  el.style.display = "block";
  el.className = "msg" + (type ? " " + type : "");
  el.textContent = text;
}

export function hideMsg(el){ el.style.display="none"; el.textContent=""; }

export function todayISO(){
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  return `${yyyy}-${mm}-${dd}`;
}

export function isFuture(dateISO){
  return dateISO > todayISO();
}

export function randomInviteCode(){
  // largo para evitar brute force (sin backend)
  const chunk = () => Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${chunk()}-${chunk()}-${chunk()}`; // ej: 3F9K2A-QP1Z0B-8TLMN7
}

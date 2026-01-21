import { db } from "./firebase_v2.js";
import {
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// ---- Users
export async function getUserProfile(uid){
  const snap = await getDoc(doc(db,"users",uid));
  return snap.exists() ? snap.data() : null;
}

// ---- Units
export async function listUnits(){
  const snaps = await getDocs(query(collection(db,"units"), orderBy("nombre","asc")));
  return snaps.docs.map(d=>({id:d.id, ...d.data()}));
}
export async function createUnit(data){ return addDoc(collection(db,"units"), data); }
export async function updateUnit(id, data){ return updateDoc(doc(db,"units",id), data); }
export async function deleteUnit(id){ return deleteDoc(doc(db,"units",id)); }

// ---- Personnel
export async function listPersonnelByUnit(unitId){
  const snaps = await getDocs(query(collection(db,"personnel"), where("unitId","==",unitId), orderBy("grado","asc")));
  return snaps.docs.map(d=>({id:d.id, ...d.data()}));
}
export async function createPerson(data){ return addDoc(collection(db,"personnel"), data); }
export async function updatePerson(id,data){ return updateDoc(doc(db,"personnel",id), data); }
export async function deletePerson(id){ return deleteDoc(doc(db,"personnel",id)); }

// ---- Reports
export async function getReport(unitId, fechaISO){
  const snaps = await getDocs(query(
    collection(db,"dailyReports"),
    where("unitId","==",unitId),
    where("fecha","==",fechaISO),
    limit(1)
  ));
  if (snaps.empty) return null;
  const d = snaps.docs[0];
  return { id:d.id, ...d.data() };
}

export async function createEmptyReport({unitId, fechaISO, uid}){
  return addDoc(collection(db,"dailyReports"), {
    unitId,
    fecha: fechaISO,
    publicado:false,
    editable:true,
    creadoPor: uid,
    actualizadoEn: Date.now(),
    registros: []
  });
}

export async function saveReport(reportId, payload){
  payload.actualizadoEn = Date.now();
  return updateDoc(doc(db,"dailyReports",reportId), payload);
}

export async function listReportsByDate(fechaISO){
  const snaps = await getDocs(query(collection(db,"dailyReports"), where("fecha","==",fechaISO)));
  return snaps.docs.map(d=>({id:d.id, ...d.data()}));
}

export async function reopenReport(reportId){
  return updateDoc(doc(db,"dailyReports",reportId), { editable:true });
}

export async function lockReport(reportId){
  return updateDoc(doc(db,"dailyReports",reportId), { editable:false, publicado:true });
}

// ---- Invites (docId = code)
export async function getInviteByCode(code){
  const snap = await getDoc(doc(db,"invites",code));
  return snap.exists() ? ({ id:snap.id, ...snap.data() }) : null;
}

export async function createInvite(code, data){
  // docId = code (más fácil para "get" sin listar)
  return setDoc(doc(db,"invites",code), data);
}

export async function markInviteUsed(code, uid){
  return updateDoc(doc(db,"invites",code), {
    used:true,
    usedBy: uid,
    usedAt: Date.now()
  });
}


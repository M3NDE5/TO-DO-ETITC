import { collection, addDoc, onSnapshot, query, orderBy, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

const COLECCION = "tareas";

export function crearTarea(datos) {
  return addDoc(collection(db, COLECCION), datos);
}

export function suscribirTareas(sessionId, callback) {
  const q = query(collection(db, COLECCION), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const tareas = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((t) => t.sessionId === sessionId);
    callback(tareas);
  });
}

export function eliminarTarea(idTarea) {
  return deleteDoc(doc(db, COLECCION, idTarea));
}

export function actualizarTarea(idTarea, cambios) {
  return updateDoc(doc(db, COLECCION, idTarea), cambios);
}

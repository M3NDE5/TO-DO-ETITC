import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";

const eliminarTarea = async function() {
    await deleteDoc(doc(db, "tareas", "tarea_002"));
}

export default eliminarTarea
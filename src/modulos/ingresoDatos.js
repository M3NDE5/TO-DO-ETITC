import { doc, setDoc } from "firebase/firestore"; 
import { db } from "../firebase";



const crear = async function(){
    await setDoc(doc(db, "tareas", "tarea_003"), {
        name: "Los Angeles",
        state: "CA",
        country: "USA"
    });
}

export default crear
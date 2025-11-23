import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);     // usuario logueado
  const [loading, setLoading] = useState(true); // evita pantallas parpadeando

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
export const handleLogout = async () => {
  await signOut(auth);
  console.log("Sesión cerrada");
};

export function useAuth() {
  return useContext(AuthContext);
}

// Devuelve la sesión/autenticación actual desde cualquier lugar (no solo hooks)
export async function getAuthSession() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      unsubscribe();
      if (currentUser) {
        try {
          const docRef = doc(db, "usuarios", currentUser.uid);
          const docSnap = await getDoc(docRef);
          let role = null;
          let photoURL = currentUser.photoURL || null;
          if (docSnap.exists()) {
            const data = docSnap.data();
            role = data.role || null;
            if (data.photoURL) photoURL = data.photoURL;
          }
          // Retornar el usuario con role y photoURL
          resolve({ ...currentUser, role, photoURL });
        } catch (error) {
          resolve({ ...currentUser, role: null, photoURL: currentUser.photoURL || null });
        }
      } else {
        resolve(null);
      }
    });
  });
}

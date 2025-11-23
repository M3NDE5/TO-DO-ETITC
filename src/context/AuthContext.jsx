import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

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
export function getAuthSession() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      unsubscribe();
      resolve(currentUser);
    });
  });
}

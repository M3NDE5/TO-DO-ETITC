import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);     // Datos del usuario
  const [loading, setLoading] = useState(true); // Evita parpadeos en pantalla

  useEffect(() => {
    // Listener que observa si hay usuario logueado
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Limpieza del listener
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Hook para usar el context en cualquier componente
export function useAuth() {
  return useContext(AuthContext);
}

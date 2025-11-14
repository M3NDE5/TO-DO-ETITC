import { Navigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase.js";

function ProtectedRoute({ children }) {
  const [user, loading] = useAuthState(auth);

  if (loading) return <p className="text-white text-center mt-10">Cargando...</p>;
  
  if (!user) return <Navigate to="/login" replace />;
    
  return children;
}

export default ProtectedRoute;

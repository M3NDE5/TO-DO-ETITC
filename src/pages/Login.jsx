import { useState } from "react";
import { FaRegUserCircle } from "react-icons/fa";
import { CiLock } from "react-icons/ci";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, Link } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("Inicio de sesión exitoso");
      navigate("/dashboard"); // redirige a tu sección principal
    } catch (err) {
      console.error(err);
      if (err.code === "auth/invalid-credential") {
        setError("Correo o contraseña incorrectos");
      } else if (err.code === "auth/user-not-found") {
        setError("No existe una cuenta con este correo");
      } else if (err.code === "auth/wrong-password") {
        setError("Contraseña incorrecta");
      } else {
        setError("Error al iniciar sesión");
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#23253a] px-2 py-8">
      <div className="w-full max-w-sm md:max-w-md bg-[#36395A] rounded-3xl shadow-2xl flex flex-col gap-8 px-6 py-8 md:px-10 md:py-12">
        <h1 className="text-white text-xl md:text-2xl font-semibold text-center mb-2">Inicia sesión</h1>
        <form onSubmit={handleLogin} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-gray-200 text-xs md:text-sm font-semibold uppercase tracking-wide mb-1" htmlFor="email">
              Usuario (Email)
            </label>
            <div className="flex items-center gap-3 bg-[#545b88] rounded-xl shadow-md px-4 py-3">
              <FaRegUserCircle className="text-white text-2xl shrink-0" aria-hidden="true" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="diego@gmail.com"
                className="flex-1 bg-transparent text-gray-100 placeholder-gray-300 text-base focus:outline-none"
                required
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-gray-300 text-xs md:text-sm font-semibold uppercase tracking-wide mb-1" htmlFor="password">
              Contraseña
            </label>
            <div className="flex items-center gap-3 bg-[#545b88] rounded-xl shadow-md px-4 py-3">
              <CiLock className="text-gray-200 text-2xl shrink-0" aria-hidden="true" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="•••••••"
                className="flex-1 bg-transparent text-gray-100 placeholder-gray-400 text-base focus:outline-none"
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center -mt-2">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-400 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-700 text-white font-bold tracking-wide px-6 py-3 rounded-xl shadow-lg transition active:scale-[.97] text-base"
          >
            Iniciar sesión
          </button>
        </form>
        <div className="text-center mt-2">
          <span className="text-gray-300 text-sm">¿No tienes una cuenta? </span>
          <Link to="/register" className="text-indigo-400 font-semibold hover:underline transition">Regístrate</Link>
        </div>
      </div>
    </div>
  );
}

export default Login; // aqui estoy exportando el id del usuario de firebase y el componente

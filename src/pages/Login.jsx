import { useState } from "react";
import { FaRegUserCircle } from "react-icons/fa";
import { CiLock } from "react-icons/ci";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";

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
    <div className="min-h-screen w-full flex items-center justify-center bg-[#252840] px-4 py-8">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md bg-[#36395A] rounded-3xl shadow-xl flex flex-col gap-8 px-10 py-12 md:px-14 md:py-16"
      >
        <h1 className="text-white text-2xl md:text-3xl font-semibold text-center">Inicia sesión</h1>

        <div className="flex flex-col bg-[#545b88] rounded-2xl p-2 md:p-6 gap-4 shadow-md">
          <label className="text-gray-200 text-xs md:text-sm font-semibold uppercase tracking-wide">
            Usuario (Email)
          </label>
          <div className="flex items-center gap-3">
            <FaRegUserCircle className="text-white text-2xl shrink-0" aria-hidden="true" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="diego@gmail.com"
              className="flex-1 bg-transparent text-gray-100 placeholder-gray-300 text-sm md:text-base focus:outline-none"
              required
              autoComplete="email"
              autoFocus
            />
          </div>
        </div>

        <div className="flex flex-col bg-[#545b88] rounded-2xl p-5 md:p-6 gap-4 shadow-md">
          <label className="text-gray-300 text-xs md:text-sm font-semibold uppercase tracking-wide">
            Contraseña
          </label>
          <div className="flex items-center gap-3">
            <CiLock className="text-gray-200 text-2xl shrink-0" aria-hidden="true" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="•••••••"
              className="flex-1 bg-transparent text-gray-100 placeholder-gray-400 text-sm md:text-base focus:outline-none"
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
          className="w-full bg-[#b0b0b0] hover:bg-white text-black font-medium tracking-wide px-6 py-3 rounded-xl shadow-lg transition active:scale-[.97] text-sm md:text-base"
        >
          Iniciar sesión
        </button>

        <div className="text-center text-[11px] text-gray-400 mt-2">
          <p>¿Olvidaste tu contraseña? Recupera el acceso pronto.</p>
        </div>
      </form>
    </div>
  );
}

export default Login; // aqui estoy exportando el id del usuario de firebase y el componente

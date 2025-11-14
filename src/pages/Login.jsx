import { useState } from "react";
import { FaRegUserCircle } from "react-icons/fa";
import { CiLock } from "react-icons/ci";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

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
      navigate("/home"); // redirige a tu sección principal
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
    <div className="flex flex-col justify-center content-center w-screen h-screen bg-[#252840]">
      <form
        onSubmit={handleLogin}
        className="flex flex-col justify-center items-center w-full h-full bg-[#36395A] rounded-lg"
      >
        <h1 className="text-white mb-2 text-4xl">Inicia sesión para continuar</h1>

        <div className="w-1/2 mb-6">
          <div className="flex flex-col bg-[#424459] rounded-lg p-3 px-7">
            <label className="text-gray-400 text-sm font-semibold mb-2 block uppercase">
              USUARIO (EMAIL)
            </label>
            <div className="flex flex-row items-center">
              <FaRegUserCircle className="text-gray-400 text-xl mr-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="diego@gmail.com"
                className="flex-grow bg-transparent text-[#bebebe] outline-none placeholder-gray-500"
                required
              />
            </div>
          </div>
        </div>

        <div className="w-1/2 mb-6">
          <div className="flex flex-col bg-[#424459] rounded-lg p-3 px-7">
            <label className="text-gray-400 text-sm font-semibold mb-2 block uppercase">
              CONTRASEÑA
            </label>
            <div className="flex flex-row items-center">
              <CiLock className="text-gray-400 text-xl mr-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="*******"
                className="flex-grow bg-transparent text-[#bebebe] outline-none placeholder-gray-500"
                required
              />
            </div>
          </div>
        </div>

        {error && <p className="text-red-400 mb-4">{error}</p>}

        <button
          type="submit"
          className="bg-[#b0b0b0] text-black px-12 py-2 rounded-xl shadow-lg"
        >
          INICIAR SESIÓN
        </button>
      </form>
    </div>
  );
}

export default Login;

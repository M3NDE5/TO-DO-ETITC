import { useState } from "react";
import { FaRegUserCircle } from "react-icons/fa";
import { CiLock } from "react-icons/ci";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase.js"; // asegúrate de que la ruta sea correcta

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log("Usuario registrado:", userCredential.user);
      setSuccess("Usuario registrado correctamente");
      setEmail("");
      setPassword("");
    } catch (err) {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        setError("El correo ya está en uso.");
      } else if (err.code === "auth/invalid-email") {
        setError("El correo no es válido.");
      } else if (err.code === "auth/weak-password") {
        setError("La contraseña debe tener al menos 6 caracteres.");
      } else {
        setError("Error al registrar el usuario.");
      }
    }
  };

  return (
    <div className="flex flex-col justify-center content-center w-screen h-screen bg-[#252840]">
      <form
        onSubmit={handleRegister}
        className="flex flex-col justify-center items-center w-full h-full bg-[#36395A] rounded-lg"
      >
        <h1 className="text-white mb-2 text-4xl">REGISTRO</h1>
        <h1 className="text-white mb-10 text-xl">Completa los siguientes campos</h1>

        <div className="w-1/2 mb-6">
          <div className="flex flex-col bg-[#424459] rounded-lg p-3 px-7">
            <label htmlFor="email" className="text-gray-400 text-sm font-semibold mb-2 block uppercase">
              NOMBRE DE USUARIO (EMAIL)
            </label>
            <div className="flex flex-row items-center">
              <FaRegUserCircle className="text-gray-400 text-xl mr-3" />
              <input
                type="email"
                id="email"
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
            <label htmlFor="password" className="text-gray-400 text-sm font-semibold mb-2 block uppercase">
              CREAR CONTRASEÑA
            </label>
            <div className="flex flex-row items-center">
              <CiLock className="text-gray-400 text-xl mr-3" />
              <input
                type="password"
                id="password"
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
        {success && <p className="text-green-400 mb-4">{success}</p>}

        <button type="submit" className="bg-[#b0b0b0] text-black px-12 py-2 rounded-xl shadow-lg">
          REGISTRARSE
        </button>
      </form>
    </div>
  );
}

export default Register;

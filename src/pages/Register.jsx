import { useState } from "react";
import { FaRegUserCircle } from "react-icons/fa";
import { CiLock } from "react-icons/ci";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "../firebase";
import { Link } from "react-router-dom";
import { setDoc, doc } from "firebase/firestore";
// Configuración Cloudinary
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dh1bzvq15/image/upload";
const CLOUDINARY_UPLOAD_PRESET = "Fotos de Perfil";

// Si tienes funciones de perfil en AuthContext, podrías importarlas aquí
// import { useAuth } from "../context/AuthContext";
function Register() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      // Si el usuario subió imagen, subirla a Cloudinary y obtener URL
      let photoURL = null;
      if (profileImage) {
        const formData = new FormData();
        formData.append("file", profileImage);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
        const res = await fetch(CLOUDINARY_URL, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        photoURL = data.secure_url;
      }

      // Actualizar displayName y photoURL en perfil de usuario
      const profileData = { displayName: nombre };
      if (photoURL) profileData.photoURL = photoURL;
      await updateProfile(user, profileData);

      // Guardar rol, nombre y photoURL en Firestore (usando db de firebase.js)
      await setDoc(doc(db, "usuarios", user.uid), {
        nombre,
        email,
        role,
        photoURL: photoURL || null,
        uid: user.uid,
        creado: new Date()
      });
      setSuccess("¡Usuario registrado correctamente! Ya puedes iniciar sesión.");
      setNombre("");
      setEmail("");
      setPassword("");
      setRole("");
      setProfileImage(null);
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
    <div className="min-h-screen w-full flex items-center justify-center bg-[#23253a] px-2 py-8">
      <div className="w-full max-w-sm md:max-w-md bg-[#36395A] rounded-3xl shadow-2xl flex flex-col gap-8 px-6 py-8 md:px-10 md:py-12">
        <h2 className="text-white text-xl md:text-2xl font-semibold text-center mb-2">Crea tu cuenta</h2>
        <form onSubmit={handleRegister} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-gray-200 text-xs md:text-sm font-semibold uppercase tracking-wide mb-1" htmlFor="nombre">
              Nombre completo
            </label>
            <div className="flex items-center gap-3 bg-[#545b88] rounded-xl shadow-md px-4 py-3">
              <FaRegUserCircle className="text-white text-2xl shrink-0" aria-hidden="true" />
              <input
                id="nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Diego Rodriguez"
                className="flex-1 bg-transparent text-gray-100 placeholder-gray-300 text-base focus:outline-none"
                required
                autoComplete="name"
              />
            </div>
          </div>

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
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-gray-300 text-xs md:text-sm font-semibold uppercase tracking-wide mb-1" htmlFor="password">
              Crear contraseña
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
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-gray-300 text-xs md:text-sm font-semibold uppercase tracking-wide mb-1" htmlFor="profileImage">
              Foto de perfil (opcional)
            </label>
            <div className="flex items-center gap-3 bg-[#545b88] rounded-xl shadow-md px-4 py-3">
              <label htmlFor="profileImage" className="cursor-pointer bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg shadow transition whitespace-nowrap">
                {profileImage ? "Imagen seleccionada" : "Seleccionar imagen"}
              </label>
              <input
                id="profileImage"
                type="file"
                accept="image/*"
                onChange={(e) => setProfileImage(e.target.files[0] ?? null)}
                className="hidden"
              />
              {profileImage && (
                <span className="text-gray-200 text-xs truncate max-w-[120px]">{profileImage.name}</span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-gray-300 text-xs md:text-sm font-semibold uppercase tracking-wide mb-1" htmlFor="role">
              Rol
            </label>
            <div className="flex items-center gap-3 bg-[#545b88] rounded-xl shadow-md px-4 py-3">
              <input
                id="role"
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Ej: estudiante"
                className="flex-1 bg-transparent text-gray-100 placeholder-gray-400 text-base focus:outline-none"
                required
                autoComplete="off"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center -mt-2">{error}</p>
          )}
          {success && (
            <p className="text-green-400 text-sm text-center -mt-2">{success}</p>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-400 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-700 text-white font-bold tracking-wide px-6 py-3 rounded-xl shadow-lg transition active:scale-[.97] text-base"
          >
            Registrarse
          </button>
        </form>
        <div className="text-center mt-2">
          <span className="text-gray-300 text-sm">¿Ya tienes una cuenta? </span>
          <Link to="/login" className="text-indigo-400 font-semibold hover:underline transition">Inicia sesión aquí</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;

"use client";

import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

export default function LoginWithGoogle() {
  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      console.log("Logueado:", result.user);
    } catch (error) {
      console.error("Error al loguear:", error);
    }
  };

  return (
    <button
      onClick={handleLogin}
      style={{
        padding: "10px 20px",
        background: "#4285F4",
        color: "white",
        borderRadius: "6px",
      }}
    >
      Iniciar sesión con Google
    </button>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase"; // ajustá si tu archivo se llama distinto

export default function LoginWithGoogle() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);

      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      console.log("Logueado:", result.user);

      // cuando todo sale bien, lo mandamos al admin
      router.push("/admin");
    } catch (error: any) {
      console.error("Error al iniciar sesión:", error);
      alert(error?.message ?? "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogin}
      disabled={loading}
      className="
        w-full flex items-center justify-center gap-2
        rounded-lg border bg-white px-4 py-3
        text-sm font-medium
        shadow-sm
        hover:bg-slate-50
        disabled:opacity-60 disabled:cursor-not-allowed
      "
    >
      <span
        className="
          flex h-5 w-5 items-center justify-center
          rounded-full border
          text-[11px] font-bold
        "
      >
        G
      </span>
      {loading ? "Conectando..." : "Continuar con Google"}
    </button>
  );
}

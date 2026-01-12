"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginWithGoogle() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);

      // ✅ Persistencia: queda logueado aunque recargues / cierres pestaña
      await setPersistence(auth, browserLocalPersistence);

      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      const result = await signInWithPopup(auth, provider);

      console.log("Logueado:", result.user);

      // ✅ mandalo al admin home
      router.replace("/admin");
    } catch (error: any) {
      console.error("Error al iniciar sesión:", error);

      // Mensajes más amigables según error típico
      const code = error?.code as string | undefined;

      if (code === "auth/popup-closed-by-user") {
        alert("Se cerró la ventana de Google. Probá de nuevo.");
      } else if (code === "auth/unauthorized-domain") {
        alert(
          "Dominio no autorizado en Firebase Auth. Agregalo en Authentication > Settings > Authorized domains."
        );
      } else {
        alert(error?.message ?? "Error al iniciar sesión");
      }
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

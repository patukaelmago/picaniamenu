"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginWithGoogle() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/admin/picana"); // TEMP
      } else {
        setChecking(false);
      }
    });

    return () => unsub();
  }, [router]);

  const handleLogin = async () => {
    try {
      setLoading(true);

      await setPersistence(auth, browserLocalPersistence);

      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);

      router.replace("/admin/picana"); // TEMP
    } catch (error) {
      console.error("Error en login:", error);
      setLoading(false);
    }
  };

  if (checking) {
    return <div className="p-6">Cargando...</div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <button
        onClick={handleLogin}
        disabled={loading}
        className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {loading ? "Ingresando..." : "Continuar con Google"}
      </button>
    </div>
  );
}
"use client";
const SUPERADMINS = ["patriciouskaer@gmail.com"];
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export default function LoginWithGoogle() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);

      await setPersistence(auth, browserLocalPersistence);

      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      const result = await signInWithPopup(auth, provider);

      const email = (result.user.email ?? "").toLowerCase();
      if (!email) throw new Error("No se pudo leer el email del usuario.");

      // 1) Superadmin => entra a cualquier tenant (default: picana)
      const superSnap = await getDoc(doc(db, "superadmins", email));
      if (superSnap.exists() && superSnap.data()?.enabled === true) {
        router.replace("/admin/picana");
        return;
      }

      // 2) Admin por tenant => buscamos primer tenant donde exista tenants/{id}/admins/{email}
      const tenantsSnap = await getDocs(collection(db, "tenants"));

      for (const t of tenantsSnap.docs) {
        const tenantId = t.id;
        const adminSnap = await getDoc(doc(db, "tenants", tenantId, "admins", email));
        if (adminSnap.exists() && adminSnap.data()?.enabled === true) {
          router.replace(`/admin/${tenantId}`);
          return;
        }
      }

      // 3) No autorizado
      alert("Tu correo no está autorizado para ningún restaurante.");
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
"use client";

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

      // 1) Superadmin (NO TOCAR)
      const superSnap = await getDoc(doc(db, "superadmins", email));
      if (superSnap.exists() && superSnap.data()?.enabled === true) {
        router.replace("/select-tenant");
        return;
      }

      // 2) Supervisor (NUEVO)
      const supervisorSnap = await getDoc(doc(db, "supervisors", email));

      if (supervisorSnap.exists() && supervisorSnap.data()?.enabled === true) {
        const tenants: string[] = supervisorSnap.data()?.tenants ?? [];

        if (tenants.length === 1) {
          router.replace(`/admin/${tenants[0]}/menu`);
        } else {
          router.replace("/select-tenant");
        }

        return;
      }

      // 3) Admin por tenant (NO TOCAR)
      const tenantsSnap = await getDocs(collection(db, "tenants"));

      for (const t of tenantsSnap.docs) {
        const tenantId = t.id;

        const adminSnap = await getDoc(
          doc(db, "tenants", tenantId, "admins", email)
        );

        if (adminSnap.exists() && adminSnap.data()?.enabled === true) {
          router.replace(`/admin/${tenantId}/menu`);
          return;
        }
      }

      // 4) No autorizado
      router.replace("/no-access");
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
        flex w-full items-center justify-center gap-3
        rounded-xl border border-[#3A3A3A] bg-[#2B2B2B] px-4 py-3.5
        text-sm font-semibold text-[#F5EEDC]
        shadow-sm
        transition-all
        hover:border-[#4B75FF] hover:bg-[#4B75FF]
        active:translate-y-0.5 active:scale-[0.98]
        disabled:cursor-not-allowed disabled:opacity-60
      "
    >
      <img
        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
        alt="Google"
        className="h-5 w-5"
      />
      {loading ? "Conectando..." : "Continuar con Google"}
    </button>
  );
}
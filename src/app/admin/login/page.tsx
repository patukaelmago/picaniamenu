
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
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { DEFAULT_TENANT } from "@/lib/tenants";

export default function LoginWithGoogle() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);

  const findAuthorizedTenantAndRedirect = async (email: string) => {
    try {
      const lowEmail = email.toLowerCase();
      
      // 1. Verificar si es Superadmin
      const superSnap = await getDoc(doc(db, "superadmins", lowEmail));
      if (superSnap.exists() && superSnap.data()?.enabled === true) {
        router.replace(`/admin/${DEFAULT_TENANT}/menu`);
        return;
      }

      // 2. Buscar en qué tenant es admin
      const tenantsSnap = await getDocs(collection(db, "tenants"));
      for (const t of tenantsSnap.docs) {
        const tenantId = t.id;
        const adminSnap = await getDoc(doc(db, "tenants", tenantId, "admins", lowEmail));
        if (adminSnap.exists() && adminSnap.data()?.enabled === true) {
          router.replace(`/admin/${tenantId}/menu`);
          return;
        }
      }

      // 3. Si no tiene acceso a nada
      router.replace("/no-access");
    } catch (error) {
      console.error("Error al buscar tenant autorizado:", error);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        findAuthorizedTenantAndRedirect(user.email);
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
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(auth, provider);

      if (result.user.email) {
        await findAuthorizedTenantAndRedirect(result.user.email);
      }
    } catch (error) {
      console.error("Error en login:", error);
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <p className="animate-pulse text-muted-foreground">Comprobando sesión...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-6">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold font-headline">Panel de Control</h1>
          <p className="text-muted-foreground text-sm">Iniciá sesión para gestionar tu menú</p>
        </div>
        
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 rounded-lg border bg-white px-4 py-3 text-sm font-medium shadow-sm transition-all hover:bg-slate-50 disabled:opacity-50"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="h-5 w-5" />
          {loading ? "Ingresando..." : "Continuar con Google"}
        </button>
      </div>
    </div>
  );
}

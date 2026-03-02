"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
// import { resolveTenantIdByEmail } from "@/lib/tenancy"; // si ya lo tenés

export default function AdminLoginPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setChecking(false);
        return;
      }

      // Si es single-tenant por ahora:
      // router.replace("/admin");

      // Si ya estás multitenant:
      // const tenantId = await resolveTenantIdByEmail(user.email!);
      // router.replace(`/admin/${tenantId}`);

      router.replace("/admin/picana"); // TEMP: para probar hoy
    });

    return () => unsub();
  }, [router]);

  if (checking) return null; // o spinner

  return (
    // ... tu UI de "Continuar con Google"
    // (si ya está logueado, nunca llega acá)
    <div />
  );
}
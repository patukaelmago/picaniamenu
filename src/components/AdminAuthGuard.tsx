"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // No está logueado → al login
        router.replace("/login");
        return;
      }

      // 🔹 POR AHORA: si está logueado, lo dejamos pasar
      setChecking(false);

      // 🔹 MÁS ADELANTE: acá vamos a chequear el claim "admin"
      /*
      const idTokenResult = await user.getIdTokenResult();
      const isAdmin = !!idTokenResult.claims?.admin;
      if (!isAdmin) {
        router.replace("/no-access");
        return;
      }
      setChecking(false);
      */
    });

    return () => unsub();
  }, [router]);

  if (checking) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        Comprobando sesión...
      </div>
    );
  }

  return <>{children}</>;
}

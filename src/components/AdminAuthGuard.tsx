"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase"; // ajustá la ruta si en tu repo es diferente
import { onAuthStateChanged } from "firebase/auth";

export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // No logueado → al login
        router.replace("/login");
        return;
      }

      try {
        // Optional: comprobación de custom claim "admin"
        const idTokenResult = await user.getIdTokenResult();
        const isAdmin = !!idTokenResult.claims?.admin;

        if (!isAdmin) {
          // Si preferís, redirigir a una pantalla de "no access"
          router.replace("/no-access");
          return;
        }

        // Si todo OK, permitimos el acceso
        setChecking(false);
      } catch (err) {
        console.error("Error verificando token:", err);
        router.replace("/login");
      }
    });

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (checking) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        Comprobando sesión...
      </div>
    );
  }

  return <>{children}</>;
}

"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

export default function AdminAuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  // ==============================
  // FLAGS DE ENTORNO
  // ==============================

  const isPreview =
    process.env.NEXT_PUBLIC_PREVIEW === "true" ||
    process.env.NODE_ENV !== "production";

  // si querés forzar auth incluso en dev
  const forceGuard = process.env.NEXT_PUBLIC_ADMIN_GUARD === "true";

  // regla final:
  // - producción: SIEMPRE protegido
  // - dev/preview: solo si forceGuard=true
  const mustGuard = process.env.NODE_ENV === "production" || forceGuard;

  // ==============================
  // AUTH GUARD
  // ==============================

  useEffect(() => {
    if (!mustGuard) {
      setChecking(false);
      return;
    }

    const isAdminLogin = pathname === "/admin/login";

    const unsub = onAuthStateChanged(auth, async (user) => {
      // ❌ no logueado
      if (!user || !user.email) {
        if (!isAdminLogin) router.replace("/admin/login");
        setChecking(false);
        return;
      }

      try {
        // 🔐 VALIDACIÓN POR WHITELIST
        const email = user.email.toLowerCase();
        const ref = doc(db, "admin_allowlist", email);
        const snap = await getDoc(ref);

        if (!snap.exists() || snap.data()?.enabled !== true) {
          console.warn("Acceso denegado para:", email);
          router.replace("/admin/login");
          return;
        }

        // ✅ autorizado
        if (isAdminLogin) {
          router.replace("/admin");
        }

        setChecking(false);
      } catch (err) {
        console.error("Error validando admin:", err);
        router.replace("/admin/login");
      }
    });

    return () => unsub();
  }, [router, pathname, mustGuard]);

  // ==============================
  // LOADING
  // ==============================

  if (checking) {
    return (
      <div className="p-10 text-center text-sm text-muted-foreground">
        Comprobando sesión…
      </div>
    );
  }

  return <>{children}</>;
}

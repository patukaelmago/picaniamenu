"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function AdminAuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  const isPreview =
    process.env.NEXT_PUBLIC_PREVIEW === "true" ||
    process.env.NODE_ENV !== "production";

  // ✅ si querés forzar auth aunque sea preview/dev
  const forceGuard = process.env.NEXT_PUBLIC_ADMIN_GUARD === "true";

  // ✅ regla final:
  // - en prod: siempre protege
  // - en dev/preview: protege SOLO si forceGuard=true
  const mustGuard = process.env.NODE_ENV === "production" || forceGuard;

  useEffect(() => {
    if (!mustGuard) {
      setChecking(false);
      return;
    }

    const isAdminLogin = pathname === "/admin/login";

    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        if (!isAdminLogin) router.replace("/admin/login");
        setChecking(false);
        return;
      }

      if (isAdminLogin) {
        router.replace("/admin");
      }

      setChecking(false);
    });

    return () => unsub();
  }, [router, pathname, mustGuard]);

  if (checking) {
    return (
      <div className="p-10 text-center text-sm text-muted-foreground">
        Comprobando sesión...
      </div>
    );
  }

  return <>{children}</>;
}

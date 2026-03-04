"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

function getTenantId(pathname: string | null) {
  if (!pathname) return null;
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "admin") return null;
  return parts[1] ?? null; // /admin/{tenantId}
}

export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      const isAdminLogin = pathname === "/admin/login";
      const tenantId = getTenantId(pathname);

      // si estás en /admin/login, dejá renderizar el login (no bloquees)
      if (isAdminLogin) {
        setChecking(false);
        return;
      }

      // no logueado
      if (!user || !user.email) {
        router.replace("/admin/login");
        setChecking(false);
        return;
      }

      const email = user.email.toLowerCase();

      try {
        // 1) superadmin
        const superSnap = await getDoc(doc(db, "superadmins", email));
        if (superSnap.exists() && superSnap.data()?.enabled === true) {
          setChecking(false);
          return;
        }

        // 2) tenant obligatorio por URL
        if (!tenantId) {
          await signOut(auth);
          router.replace("/admin/login");
          return;
        }

        // 3) admin del tenant
        const adminSnap = await getDoc(doc(db, "tenants", tenantId, "admins", email));
        if (!adminSnap.exists() || adminSnap.data()?.enabled !== true) {
          await signOut(auth);
          router.replace("/admin/login");
          return;
        }

        setChecking(false);
      } catch (e) {
        await signOut(auth);
        router.replace("/admin/login");
      }
    });

    return () => unsub();
  }, [router, pathname]);

  if (checking) {
    return <div className="p-10 text-center text-sm text-muted-foreground">Comprobando sesión…</div>;
  }

  return <>{children}</>;
}
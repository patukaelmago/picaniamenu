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
  return parts[1] ?? null;
}

export default function AdminAuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      const isAdminLogin = pathname === "/admin/login";
      const tenantId = getTenantId(pathname);

      if (isAdminLogin) {
        setChecking(false);
        return;
      }

      if (!user || !user.email) {
        router.replace("/admin/login");
        setChecking(false);
        return;
      }

      const email = user.email.toLowerCase();

      try {
        // Superadmin
        const superSnap = await getDoc(doc(db, "superadmins", email));
        if (superSnap.exists() && superSnap.data()?.enabled === true) {
          setChecking(false);
          return;
        }

        // Supervisor
        const supervisorSnap = await getDoc(doc(db, "supervisors", email));
        if (supervisorSnap.exists() && supervisorSnap.data()?.enabled === true) {
          const tenants: string[] = supervisorSnap.data()?.tenants ?? [];

          if (tenantId && tenants.includes(tenantId)) {
            setChecking(false);
            return;
          }

          await signOut(auth);
          router.replace("/admin/login");
          return;
        }

        // Admin normal
        if (!tenantId) {
          await signOut(auth);
          router.replace("/admin/login");
          return;
        }

        const adminSnap = await getDoc(
          doc(db, "tenants", tenantId, "admins", email)
        );

        if (!adminSnap.exists() || adminSnap.data()?.enabled !== true) {
          await signOut(auth);
          router.replace("/admin/login");
          return;
        }

        setChecking(false);
      } catch {
        await signOut(auth);
        router.replace("/admin/login");
      }
    });

    return () => unsub();
  }, [router, pathname]);

  if (checking) {
    return (
      <div className="p-10 text-center text-sm text-muted-foreground">
        Comprobando sesión…
      </div>
    );
  }

  return <>{children}</>;
}
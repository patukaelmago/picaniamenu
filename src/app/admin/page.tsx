"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export default function AdminRootPage() {
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user || !user.email) {
        router.replace("/admin/login");
        return;
      }

      const email = user.email.toLowerCase();

      try {
        // 1. Superadmin => selector de tenant
        const superSnap = await getDoc(doc(db, "superadmins", email));
        if (superSnap.exists() && superSnap.data()?.enabled === true) {
          router.replace("/select-tenant");
          return;
        }

        // 2. Buscar tenant habilitado para admins normales
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

        // 3. Sin acceso
        router.replace("/no-access");
      } catch (e) {
        console.error("Error redirecting admin:", e);
        router.replace("/admin/login");
      }
    });

    return () => unsub();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground animate-pulse">
        Redirigiendo al panel de control...
      </p>
    </div>
  );
}
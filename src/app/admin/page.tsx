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
        // Superadmin
        const superSnap = await getDoc(doc(db, "superadmins", email));

        if (superSnap.exists() && superSnap.data()?.enabled === true) {
          router.replace("/select-tenant");
          return;
        }

        // Supervisor (acceso a varios restaurantes)
        const supervisorSnap = await getDoc(doc(db, "supervisors", email));

        if (supervisorSnap.exists() && supervisorSnap.data()?.enabled === true) {
          const tenants: string[] = supervisorSnap.data()?.tenants ?? [];
          router.replace(
            tenants.length === 1 ? `/admin/${tenants[0]}` : "/select-tenant"
          );
          return;
        }

        // Buscar todos los tenants donde el usuario es admin
        const tenantsSnap = await getDocs(collection(db, "tenants"));

        const allowedTenants: string[] = [];

        for (const tenant of tenantsSnap.docs) {
          const tenantId = tenant.id;

          const adminSnap = await getDoc(
            doc(db, "tenants", tenantId, "admins", email)
          );

          if (adminSnap.exists() && adminSnap.data()?.enabled === true) {
            allowedTenants.push(tenantId);
          }
        }

        if (allowedTenants.length === 0) {
          router.replace("/no-access");
          return;
        }

        if (allowedTenants.length === 1) {
          router.replace(`/admin/${allowedTenants[0]}`);
          return;
        }

        // Tiene acceso a más de un restaurante
        router.replace("/select-tenant");
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

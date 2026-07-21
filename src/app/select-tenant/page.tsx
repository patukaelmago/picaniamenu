"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

type Tenant = {
  id: string;
  name: string;
};

export default function SelectTenantPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      const email = user.email.toLowerCase();

      try {
        const superSnap = await getDoc(doc(db, "superadmins", email));
        const supervisorSnap = await getDoc(doc(db, "supervisors", email));

        const snap = await getDocs(collection(db, "tenants"));

        const visibles: Tenant[] = [];

        // Superadmin
        if (superSnap.exists() && superSnap.data()?.enabled === true) {
          for (const tenant of snap.docs) {
            if (tenant.data()?.active !== true) continue;

            visibles.push({
              id: tenant.id,
              name: tenant.data()?.name || tenant.id,
            });
          }

          setTenants(visibles);
          return;
        }

        // Supervisor
        if (supervisorSnap.exists() && supervisorSnap.data()?.enabled === true) {
          const allowedTenants: string[] =
            supervisorSnap.data()?.tenants ?? [];

          for (const tenant of snap.docs) {
            if (tenant.data()?.active !== true) continue;

            if (allowedTenants.includes(tenant.id)) {
              visibles.push({
                id: tenant.id,
                name: tenant.data()?.name || tenant.id,
              });
            }
          }

          setTenants(visibles);
          return;
        }

        // Admin normal
        for (const tenant of snap.docs) {
          if (tenant.data()?.active !== true) continue;

          const adminSnap = await getDoc(
            doc(db, "tenants", tenant.id, "admins", email)
          );

          if (adminSnap.exists() && adminSnap.data()?.enabled === true) {
            visibles.push({
              id: tenant.id,
              name: tenant.data()?.name || tenant.id,
            });
          }
        }

        setTenants(visibles);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Cargando restaurantes...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-center">
          Seleccionar restaurante
        </h1>

        {tenants.map((tenant) => (
          <Link
            key={tenant.id}
            href={`/admin/${tenant.id}/menu`}
            className="block w-full rounded-lg border p-4 text-center hover:bg-muted"
          >
            {tenant.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
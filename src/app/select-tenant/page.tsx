"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Tenant = {
  id: string;
  name: string;
};

export default function SelectTenantPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTenants = async () => {
      try {
        const snap = await getDocs(collection(db, "tenants"));

        const data = snap.docs
          .filter((doc) => doc.data()?.active === true)
          .map((doc) => ({
            id: doc.id,
            name: doc.data()?.name || doc.id,
          }));

        setTenants(data);
      } finally {
        setLoading(false);
      }
    };

    loadTenants();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Cargando tenants...
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
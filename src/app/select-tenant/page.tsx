"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ArrowRight, Store } from "lucide-react";

type Tenant = {
  id: string;
  name: string;
  logoUrl?: string;
};

export default function SelectTenantPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

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

        const addLogos = async (items: Tenant[]) =>
          Promise.all(
            items.map(async (tenant) => {
              const settingsSnap = await getDoc(
                doc(db, "tenants", tenant.id, "settings", "restaurant")
              );

              return {
                ...tenant,
                logoUrl: settingsSnap.exists()
                  ? settingsSnap.data()?.logoUrl || ""
                  : "",
              };
            })
          );

        const visibles: Tenant[] = [];

        // Superadmin
        if (superSnap.exists() && superSnap.data()?.enabled === true) {
          setIsSuperAdmin(true);

          for (const tenant of snap.docs) {
            if (tenant.data()?.active !== true) continue;

            visibles.push({
              id: tenant.id,
              name: tenant.data()?.name || tenant.id,
            });
          }

          setTenants(await addLogos(visibles));
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

          setTenants(await addLogos(visibles));
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

        setTenants(await addLogos(visibles));
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#171717] text-[#B8B2A7]">
        <p className="animate-pulse">Cargando restaurantes...</p>
      </div>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#171717] px-6 py-10 text-[#F5EEDC]">
      <div className="absolute left-[-180px] top-[-120px] h-[420px] w-[420px] rounded-full bg-[#4B75FF]/15 blur-3xl" />
      <div className="absolute bottom-[-180px] right-[-120px] h-[440px] w-[440px] rounded-full bg-[#FF7A00]/15 blur-3xl" />

      <section className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-[#3A3A3A] bg-[#202020] shadow-2xl">
        <div className="h-1.5 bg-gradient-to-r from-[#4B75FF] to-[#FF7A00]" />

        <div className="p-7 sm:p-9">
          <img
            src="/carta-online-logo.png"
            alt="Carta Online"
            className="mx-auto h-20 w-auto object-contain"
          />

          <div className="mb-7 mt-6 text-center">
            <h1 className="text-3xl font-bold">Seleccionar restaurante</h1>
            <p className="mt-2 text-sm text-[#B8B2A7]">
              Elegí la cuenta que querés administrar.
            </p>
          </div>

          {isSuperAdmin && (
            <Link
              href="/admin/tenants/new"
              className="mb-5 flex w-full items-center justify-center rounded-xl bg-[#FF7A00] px-4 py-3 font-semibold text-[#171717] transition-colors hover:bg-[#ff922e]"
            >
              Crear nuevo tenant
            </Link>
          )}

          <div className="space-y-3">
            {tenants.map((tenant) => (
              <Link
                key={tenant.id}
                href={`/admin/${tenant.id}/menu`}
                className="group flex w-full items-center gap-4 rounded-xl border border-[#3A3A3A] bg-[#2B2B2B] px-4 py-4 transition-all hover:-translate-y-0.5 hover:border-[#4B75FF] hover:bg-[#343434]"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#F5EEDC] p-1.5">
                  {tenant.logoUrl ? (
                    <img
                      src={tenant.logoUrl}
                      alt={`Logo de ${tenant.name}`}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <Store className="h-5 w-5 text-[#FF7A00]" />
                  )}
                </span>
                <span className="flex-1 font-semibold">{tenant.name}</span>
                <ArrowRight className="h-5 w-5 text-[#8F8A82] transition-transform group-hover:translate-x-1 group-hover:text-[#4B75FF]" />
              </Link>
            ))}
          </div>

          {tenants.length === 0 && (
            <p className="rounded-xl border border-[#3A3A3A] bg-[#2B2B2B] p-4 text-center text-sm text-[#B8B2A7]">
              No hay restaurantes disponibles para esta cuenta.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
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
      <div
        className="flex min-h-screen items-center justify-center bg-[#171717] px-6 text-[#F5EEDC]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 40%, rgba(75,116,255,0.12), transparent 34%), radial-gradient(circle at 85% 85%, rgba(255,107,26,0.10), transparent 28%)",
        }}
        role="status"
        aria-live="polite"
      >
        <div className="flex flex-col items-center">
          <Image
            src="/carta-online-logo.png"
            alt="Carta Online"
            width={220}
            height={132}
            priority
            className="h-auto w-[190px] sm:w-[220px]"
          />

          <div className="mt-8 h-9 w-9 animate-spin rounded-full border-[3px] border-[#FF6B1A] border-t-[#4B74FF]" />

          <p className="mt-5 text-sm tracking-wide text-[#F5EEDC]/80">
            Preparando tu panel…
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

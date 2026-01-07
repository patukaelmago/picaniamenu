"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  // ✅ Preview/dev: no bloqueamos para poder trabajar rápido
  const isPreview =
    process.env.NEXT_PUBLIC_PREVIEW === "true" ||
    process.env.NODE_ENV !== "production";

  useEffect(() => {
    if (isPreview) {
      setChecking(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      setChecking(false);
    });

    return () => unsub();
  }, [router, isPreview]);

  if (checking) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        Comprobando sesión...
      </div>
    );
  }

  return <>{children}</>;
}

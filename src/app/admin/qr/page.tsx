"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_TENANT } from "@/lib/tenants";

/**
 * Redirección de compatibilidad para la ruta vieja de admin/qr.
 * Ahora el QR vive en /admin/[tenantId]/qr.
 */
export default function AdminQrLegacyRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/admin/${DEFAULT_TENANT}/qr`);
  }, [router]);

  return (
    <div className="flex items-center justify-center p-10">
      <p className="text-muted-foreground animate-pulse">Redirigiendo a QR...</p>
    </div>
  );
}

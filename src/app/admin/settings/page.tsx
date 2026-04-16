"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_TENANT } from "@/lib/tenants";

/**
 * Redirección de compatibilidad para la ruta vieja de admin/settings.
 * Ahora la configuración vive en /admin/[tenantId]/settings.
 */
export default function AdminSettingsLegacyRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/admin/${DEFAULT_TENANT}/settings`);
  }, [router]);

  return (
    <div className="flex items-center justify-center p-10">
      <p className="text-muted-foreground animate-pulse">Redirigiendo a ajustes...</p>
    </div>
  );
}

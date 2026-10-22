"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTenantUI } from "@/hooks/use-tenant-ui";

/**
 * Página de inicio del admin de un tenant específico.
 * Redirige a la sección principal según el cliente.
 */
export default function TenantAdminIndex({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = use(params);
  const router = useRouter();
  const ui = useTenantUI(tenantId);

  useEffect(() => {
    const section = ui.adminHomeSection ?? "menu";
    router.replace(`/admin/${tenantId}/${section}`);
  }, [tenantId, router, ui.adminHomeSection]);

  return (
    <div className="flex items-center justify-center p-10">
      <p className="text-muted-foreground animate-pulse">Redirigiendo al panel de {tenantId}...</p>
    </div>
  );
}

"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";

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

  useEffect(() => {
    // Redirección inteligente basada en el tenantId dinámico
    if (tenantId.toLowerCase() === "picana") {
      router.replace(`/admin/${tenantId}/almuerzo`);
    } else {
      router.replace(`/admin/${tenantId}/menu`);
    }
  }, [tenantId, router]);

  return (
    <div className="flex items-center justify-center p-10">
      <p className="text-muted-foreground animate-pulse">Redirigiendo al panel de {tenantId}...</p>
    </div>
  );
}

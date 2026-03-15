"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Redirección principal del tenant hacia su gestión de menú o almuerzo según corresponda.
 */
export default function TenantAdminIndex({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = use(params);
  const router = useRouter();

  useEffect(() => {
    // Si es picania, mandamos a almuerzo por defecto, sino a menú
    if (tenantId === "picana") {
      router.replace(`/admin/${tenantId}/almuerzo`);
    } else {
      router.replace(`/admin/${tenantId}/menu`);
    }
  }, [tenantId, router]);

  return (
    <div className="flex items-center justify-center p-10">
      <p className="text-muted-foreground animate-pulse">Redirigiendo al panel...</p>
    </div>
  );
}

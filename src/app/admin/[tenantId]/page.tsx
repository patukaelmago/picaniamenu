"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TenantAdminIndex({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = use(params);
  const router = useRouter();

  useEffect(() => {
    // Redirigir por defecto a la gestión del menú
    router.replace(`/admin/${tenantId}/menu`);
  }, [tenantId, router]);

  return null;
}

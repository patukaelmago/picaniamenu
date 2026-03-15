"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_TENANT } from "@/lib/tenants";

/**
 * Redirección de compatibilidad para la ruta vieja de admin/menu
 */
export default function AdminMenuLegacyRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/admin/${DEFAULT_TENANT}/menu`);
  }, [router]);

  return null;
}

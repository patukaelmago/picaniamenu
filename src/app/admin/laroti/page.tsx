"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Redirección de compatibilidad para evitar rutas literales duplicadas.
 */
export default function LarotiLiteralRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/laroti/menu");
  }, [router]);

  return null;
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Redirección de compatibilidad para evitar rutas literales duplicadas.
 */
export default function PicanaLiteralRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/picana/menu");
  }, [router]);

  return null;
}

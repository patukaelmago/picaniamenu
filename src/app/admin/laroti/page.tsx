"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LarotiRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/laroti/menu");
  }, [router]);

  return null;
}

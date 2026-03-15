"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PicanaRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/picana/menu");
  }, [router]);

  return null;
}

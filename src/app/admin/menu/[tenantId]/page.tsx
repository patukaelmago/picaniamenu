"use client";

import { use } from "react";
import MenuManager from "@/components/admin/MenuManager";

export default function Page({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = use(params);
  return <MenuManager tenantId={tenantId} />;
}

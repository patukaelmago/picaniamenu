
import { use } from "react";
import { notFound } from "next/navigation";
import MenuClient from "../menu-client";
import { isTenant } from "@/lib/tenants";

export default function MenuTenantPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = use(params);

  if (!isTenant(tenantId)) return notFound();

  return <MenuClient tenantId={tenantId} />;
}

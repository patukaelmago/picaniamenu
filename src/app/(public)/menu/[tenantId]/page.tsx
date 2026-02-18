import { notFound } from "next/navigation";
import MenuClient from "../menu-client";
import { isTenant } from "@/lib/tenants";

export default function MenuTenantPage({
  params,
}: {
  params: { tenantId: string };
}) {
  if (!isTenant(params.tenantId)) return notFound();

  return <MenuClient tenantId={params.tenantId} />;
}

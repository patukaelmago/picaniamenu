import { use } from "react";
import { notFound } from "next/navigation";
import MenuClient from "../menu-client";
import { isTenant } from "@/lib/tenants";

// AGREGA ESTA LINEA PARA ARREGLAR EL ERROR DE BUILD
export const dynamicParams = true;

export default function MenuTenantPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = use(params);

  if (!isTenant(tenantId)) return notFound();

  return <MenuClient tenantId={tenantId} />;
}

// AGREGA ESTO PARA QUE EL EXPORT NO CHILLE
export function generateStaticParams() {
  return []; 
}
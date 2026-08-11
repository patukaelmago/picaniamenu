import { use } from "react";
import { notFound } from "next/navigation";
import MenuClient from "../menu-client";
import { isTenant } from "@/lib/tenants";
import type { Metadata } from "next";

// AGREGA ESTA LINEA PARA ARREGLAR EL ERROR DE BUILD
export const dynamicParams = true;

const tenantDisplayName = (tenantId: string) =>
  tenantId
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}): Promise<Metadata> {
  const { tenantId } = await params;

  return {
    title: tenantDisplayName(tenantId),
  };
}

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

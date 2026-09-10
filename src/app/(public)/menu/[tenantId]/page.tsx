import { notFound } from "next/navigation";
import MenuClient from "../menu-client";
import { isTenant } from "@/lib/tenants";
import type { Metadata } from "next";
import {
  jsonLd,
  PUBLIC_TENANTS,
  SITE_URL,
  tenantDisplayName,
} from "@/lib/seo";

// AGREGA ESTA LINEA PARA ARREGLAR EL ERROR DE BUILD
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}): Promise<Metadata> {
  const { tenantId } = await params;
  const name = tenantDisplayName(tenantId);
  const title = `Carta de ${name}`;
  const description = `Consultá la carta digital actualizada de ${name}: platos, bebidas, precios y sugerencias.`;
  const canonical = `/menu/${tenantId}`;

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      locale: "es_AR",
      url: canonical,
      siteName: "Carta Online",
      title: `${title} | Carta Online`,
      description,
    },
    twitter: {
      card: "summary",
      title: `${title} | Carta Online`,
      description,
    },
  };
}

export default async function MenuTenantPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;

  if (!isTenant(tenantId)) return notFound();

  const name = tenantDisplayName(tenantId);
  const url = `${SITE_URL}/menu/${tenantId}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: `Carta de ${name}`,
        description: `Carta digital actualizada de ${name}.`,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        inLanguage: "es-AR",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Carta Online",
            item: SITE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name,
            item: url,
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }}
      />
      <MenuClient tenantId={tenantId} />
    </>
  );
}

// AGREGA ESTO PARA QUE EL EXPORT NO CHILLE
export function generateStaticParams() {
  return PUBLIC_TENANTS.map((tenantId) => ({ tenantId }));
}

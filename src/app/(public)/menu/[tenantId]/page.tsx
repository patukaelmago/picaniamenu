import { notFound } from "next/navigation";
import MenuClient from "../menu-client";
import { isTenant } from "@/lib/tenants";
import type { Metadata } from "next";
import { cache } from "react";
import { getMenuSeo } from "@/lib/menu-seo";
import {
  jsonLd,
  PUBLIC_TENANTS,
  SITE_URL,
  tenantDisplayName,
} from "@/lib/seo";

// AGREGA ESTA LINEA PARA ARREGLAR EL ERROR DE BUILD
export const dynamicParams = true;

// El HTML para Google se renueva como máximo una vez por hora (pocas lecturas de Firebase).
export const revalidate = 3600;

const loadSeo = cache((tenantId: string) => getMenuSeo(tenantId));

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}): Promise<Metadata> {
  const { tenantId } = await params;
  const seo = await loadSeo(tenantId);
  const name = seo?.name || tenantDisplayName(tenantId);
  const title = `Carta de ${name}`;
  const description = `Consultá la carta digital actualizada de ${name}: platos, bebidas, precios y sugerencias.`;
  const canonical = `/menu/${tenantId}`;

  return {
    title,
    description,
    alternates: { canonical },
    robots: seo?.active === false ? { index: false, follow: false } : { index: true, follow: true },
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

  const seo = await loadSeo(tenantId);
  const name = seo?.name || tenantDisplayName(tenantId);
  const url = `${SITE_URL}/menu/${tenantId}`;
  const menuGraph =
    seo && seo.active && seo.sections.length > 0
      ? [
          {
            "@type": "Restaurant",
            "@id": `${url}#restaurant`,
            name,
            url,
            hasMenu: {
              "@type": "Menu",
              name: `Carta de ${name}`,
              inLanguage: "es-AR",
              hasMenuSection: seo.sections.map((section) => ({
                "@type": "MenuSection",
                name: section.name,
                hasMenuItem: section.items.map((item) => ({
                  "@type": "MenuItem",
                  name: item.name,
                  ...(item.description ? { description: item.description } : {}),
                  ...(item.price > 0
                    ? { offers: { "@type": "Offer", price: item.price, priceCurrency: "ARS" } }
                    : {}),
                })),
              })),
            },
          },
        ]
      : [];
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
      ...menuGraph,
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

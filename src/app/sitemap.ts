import type { MetadataRoute } from "next";
import { PUBLIC_TENANTS, SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/carta-digital-para-restaurantes`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/carta-con-codigo-qr`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/carta-a-y-carta-b`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...PUBLIC_TENANTS.map((tenantId) => ({
      url: `${SITE_URL}/menu/${tenantId}`,
      changeFrequency: "daily" as const,
      priority: tenantId === "maido" ? 0.8 : 0.7,
    })),
  ];
}

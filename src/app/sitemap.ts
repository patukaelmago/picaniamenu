import type { MetadataRoute } from "next";
import { PUBLIC_TENANTS, SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...PUBLIC_TENANTS.map((tenantId) => ({
      url: `${SITE_URL}/menu/${tenantId}`,
      changeFrequency: "daily" as const,
      priority: tenantId === "maido" ? 0.8 : 0.7,
    })),
  ];
}

import type { MetadataRoute } from "next";
import { PUBLIC_TENANTS, SITE_URL } from "@/lib/seo";
import { adminDb } from "@/lib/firebase-admin";

// Se rearma una vez por día: suma solas las cartas publicadas de clientes nuevos.
export const revalidate = 86400;

// Cartas que no van a Google (cuentas de prueba).
const FUERA_DE_GOOGLE = new Set(["ladepto"]);

async function cartasPublicadas(): Promise<string[]> {
  try {
    const snap = await Promise.race([
      adminDb.collection("tenants").where("active", "==", true).get(),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), 6000)),
    ]);
    const ids = snap.docs.map((d) => d.id).filter((id) => !FUERA_DE_GOOGLE.has(id));
    return ids.length > 0 ? ids : [...PUBLIC_TENANTS];
  } catch {
    return [...PUBLIC_TENANTS];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const tenants = await cartasPublicadas();
  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/carta-digital-para-restaurantes`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/carta-con-codigo-qr`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/carta-a-y-carta-b`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/administracion-de-cartas-digitales`, changeFrequency: "monthly", priority: 0.8 },
    ...tenants.map((tenantId) => ({
      url: `${SITE_URL}/menu/${tenantId}`,
      changeFrequency: "daily" as const,
      priority: tenantId === "maido" ? 0.8 : 0.7,
    })),
  ];
}

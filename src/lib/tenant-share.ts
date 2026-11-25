// Nombre y logo de cada local para la vista previa al compartir la carta (WhatsApp, redes).
// Lee solo settings/restaurant. Primero por el servidor (admin) y, si falla, por la API pública de Firestore.
import { adminDb } from "@/lib/firebase-admin";

const PROJECT_ID = "studio-4948282065-ea24d";
const API_KEY = "AIzaSyCK_WLBxq3bK2-LIc3MZEOCm1rHuEVDfeY";

export type TenantShareInfo = { name: string; logoUrl: string };

const withTimeout = <T,>(p: Promise<T>, ms: number) =>
  Promise.race([p, new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);

async function viaAdmin(tenantId: string): Promise<TenantShareInfo | null> {
  const snap = await withTimeout(
    adminDb.collection("tenants").doc(tenantId).collection("settings").doc("restaurant").get(),
    4000
  );
  if (!snap.exists) return null;
  const d = snap.data() ?? {};
  return { name: String(d.name ?? "").trim(), logoUrl: String(d.logoUrl ?? "").trim() };
}

async function viaRest(tenantId: string): Promise<TenantShareInfo | null> {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/tenants/${encodeURIComponent(
    tenantId
  )}/settings/restaurant?key=${API_KEY}`;
  const res = await withTimeout(fetch(url, { cache: "no-store" }), 4000);
  if (!res.ok) return null;
  const json = (await res.json()) as { fields?: Record<string, { stringValue?: string }> };
  return {
    name: String(json.fields?.name?.stringValue ?? "").trim(),
    logoUrl: String(json.fields?.logoUrl?.stringValue ?? "").trim(),
  };
}

export async function getTenantShareInfo(tenantId: string): Promise<TenantShareInfo | null> {
  try {
    const r = await viaAdmin(tenantId);
    if (r && (r.name || r.logoUrl)) return r;
  } catch {}
  try {
    return await viaRest(tenantId);
  } catch {
    return null;
  }
}

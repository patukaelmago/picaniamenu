// Nombre, logo y color del encabezado de cada local para la vista previa al compartir la carta.
// Lee settings/restaurant y settings/ui. Primero por el servidor (admin) y, si falla, por la API pública de Firestore.
import { adminDb } from "@/lib/firebase-admin";
import { getTenantUI } from "@/lib/tenant-ui";
import { applyBrandColors, applyColorOverrides } from "@/lib/tenant-ui/brand-colors";

const PROJECT_ID = "studio-4948282065-ea24d";
const API_KEY = "AIzaSyCK_WLBxq3bK2-LIc3MZEOCm1rHuEVDfeY";

export type TenantShareInfo = { name: string; logoUrl: string; navBg: string };

type Raw = { restaurant: Record<string, any> | null; ui: Record<string, any> | null };

const withTimeout = <T,>(p: Promise<T>, ms: number) =>
  Promise.race([p, new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);

async function viaAdmin(tenantId: string): Promise<Raw> {
  const settings = adminDb.collection("tenants").doc(tenantId).collection("settings");
  const [r, u] = await withTimeout(
    Promise.all([settings.doc("restaurant").get(), settings.doc("ui").get()]),
    4000
  );
  return { restaurant: r.exists ? r.data() ?? {} : null, ui: u.exists ? u.data() ?? {} : null };
}

// Convierte un valor de la API REST de Firestore a un valor común.
function decode(v: any): any {
  if (!v || typeof v !== "object") return undefined;
  if ("stringValue" in v) return v.stringValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("nullValue" in v) return null;
  if ("mapValue" in v) return decodeFields(v.mapValue?.fields);
  if ("arrayValue" in v) return (v.arrayValue?.values ?? []).map(decode);
  return undefined;
}
function decodeFields(fields: any): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, val] of Object.entries(fields ?? {})) out[k] = decode(val);
  return out;
}

async function restDoc(tenantId: string, docId: string): Promise<Record<string, any> | null> {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/tenants/${encodeURIComponent(
    tenantId
  )}/settings/${docId}?key=${API_KEY}`;
  const res = await withTimeout(fetch(url, { cache: "no-store" }), 4000);
  if (!res.ok) return null;
  const json = await res.json();
  return decodeFields(json.fields);
}

async function viaRest(tenantId: string): Promise<Raw> {
  const [restaurant, ui] = await Promise.all([
    restDoc(tenantId, "restaurant").catch(() => null),
    restDoc(tenantId, "ui").catch(() => null),
  ]);
  return { restaurant, ui };
}

export async function getTenantShareInfo(tenantId: string): Promise<TenantShareInfo | null> {
  let raw: Raw | null = null;
  try {
    raw = await viaAdmin(tenantId);
  } catch {}
  if (!raw || (!raw.restaurant && !raw.ui)) {
    try {
      raw = await viaRest(tenantId);
    } catch {}
  }

  const base = getTenantUI(tenantId);
  const ui = applyColorOverrides(
    applyBrandColors(base, raw?.ui?.brandColors),
    raw?.ui?.colorOverrides
  );

  return {
    name: String(raw?.restaurant?.name ?? "").trim(),
    logoUrl: String(raw?.restaurant?.logoUrl ?? "").trim(),
    navBg: ui.navBg,
  };
}

import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Direcciones que no puede usar un local (rutas del sitio y nombres confusos).
const RESERVED = new Set([
  "admin", "api", "menu", "login", "registro", "qr", "settings", "colors", "import",
  "select-tenant", "no-access", "tenants", "carta-online", "carta", "demo", "test",
  "inicio", "estadisticas", "almuerzo", "www", "app",
]);

const DEFAULT_BRAND = {
  primary: "221 51% 23%",
  background: "43 100% 95%",
  accent: "22 100% 55%",
};

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Iniciá sesión para registrarte." }, { status: 401 });

  let email = "";
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const viaGoogle = decoded.firebase?.sign_in_provider === "google.com";
    if (!viaGoogle && decoded.email_verified !== true) {
      return NextResponse.json({ error: "Registrate con una cuenta de Google." }, { status: 403 });
    }
    email = (decoded.email ?? "").toLowerCase();
  } catch {
    return NextResponse.json({ error: "Tu sesión venció. Volvé a ingresar." }, { status: 401 });
  }
  if (!email) return NextResponse.json({ error: "No pudimos leer tu email." }, { status: 400 });

  const body = (await request.json().catch(() => ({}))) as { name?: string; slug?: string };
  const name = String(body.name ?? "").trim().slice(0, 60);
  const slug = normalizeSlug(String(body.slug ?? ""));

  if (name.length < 2) {
    return NextResponse.json({ error: "Escribí el nombre del restaurante." }, { status: 400 });
  }
  if (slug.length < 3 || slug.length > 40) {
    return NextResponse.json({ error: "La dirección debe tener entre 3 y 40 letras o números." }, { status: 400 });
  }
  if (RESERVED.has(slug)) {
    return NextResponse.json({ error: "Esa dirección no está disponible. Probá con otra." }, { status: 409 });
  }

  const registroRef = adminDb.doc(`registros/${email}`);
  const tenantRef = adminDb.doc(`tenants/${slug}`);

  try {
    await adminDb.runTransaction(async (tx) => {
      const [registro, tenant] = await Promise.all([tx.get(registroRef), tx.get(tenantRef)]);
      if (registro.exists) throw new Error("YA_REGISTRADO");
      if (tenant.exists) throw new Error("OCUPADA");

      const now = FieldValue.serverTimestamp();
      tx.set(tenantRef, {
        name,
        active: false,
        pending: true,
        ownerEmail: email,
        createdAt: now,
        updatedAt: now,
      });
      tx.set(adminDb.doc(`tenants/${slug}/admins/${email}`), { enabled: true, email, createdAt: now });
      tx.set(adminDb.doc(`tenants/${slug}/settings/restaurant`), {
        name,
        currency: "ARS",
        logoUrl: "",
        websiteUrl: "",
        showLogo: true,
        showName: true,
        createdAt: now,
        updatedAt: now,
      });
      tx.set(adminDb.doc(`tenants/${slug}/settings/ui`), {
        carouselImages: [],
        brandColors: DEFAULT_BRAND,
        updatedAt: now,
      });
      tx.set(registroRef, { tenantId: slug, name, createdAt: now });
    });
  } catch (e) {
    const code = e instanceof Error ? e.message : "";
    if (code === "YA_REGISTRADO") {
      return NextResponse.json({ error: "Ya registraste un restaurante con esta cuenta." }, { status: 409 });
    }
    if (code === "OCUPADA") {
      return NextResponse.json({ error: "Esa dirección ya está en uso. Probá con otra." }, { status: 409 });
    }
    console.error("Registro:", e);
    return NextResponse.json({ error: "No se pudo completar el registro. Probá de nuevo." }, { status: 500 });
  }

  return NextResponse.json({ tenantId: slug });
}

import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { findSubscription, syncSubscription } from "@/lib/mercadopago";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// El dueño del local consulta si su pago ya se acreditó (al volver de Mercado Pago).
export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("local") ?? "";
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token || !/^[a-z0-9-]{3,40}$/.test(slug)) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }
  let email = "";
  try {
    email = ((await adminAuth.verifyIdToken(token)).email ?? "").toLowerCase();
  } catch {
    return NextResponse.json({ error: "Sesión vencida" }, { status: 401 });
  }
  const snap = await adminDb.doc(`tenants/${slug}`).get();
  if (!snap.exists || snap.data()?.ownerEmail !== email) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }
  if (snap.data()?.active === true) return NextResponse.json({ active: true });

  try {
    const p = await findSubscription(slug);
    const result = p ? await syncSubscription(p) : null;
    return NextResponse.json({ active: result?.active === true, status: p?.status ?? "none" });
  } catch {
    return NextResponse.json({ active: false, status: "unknown" });
  }
}

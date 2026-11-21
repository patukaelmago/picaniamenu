import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { revisarCobros } from "@/lib/cobros";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// El superadmin puede forzar la revisión (para probar) mandando su sesión.
async function esSuperadmin(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return false;
  try {
    const email = ((await adminAuth.verifyIdToken(token)).email ?? "").toLowerCase();
    const snap = await adminDb.doc(`superadmins/${email}`).get();
    return snap.exists && snap.data()?.enabled === true;
  } catch {
    return false;
  }
}

// Revisión diaria de cobros (la llama una tarea programada de GitHub).
// Sin sesión de superadmin corre como máximo una vez cada 20 horas aunque la llamen más veces.
export async function POST(request: Request) {
  try {
    const r = await revisarCobros({ forzar: await esSuperadmin(request) });
    return NextResponse.json(r);
  } catch (e) {
    console.error("Revisar cobros:", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

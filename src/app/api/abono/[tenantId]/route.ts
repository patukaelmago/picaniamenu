import { NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { createSubscription, findSubscription, SITE } from "@/lib/mercadopago";
import { bajaDesdePanel } from "@/lib/bajas";
import { registrarEvento } from "@/lib/cobros-historial";
import { avisar } from "@/lib/avisos";
import { diasEntre, hoyAR, precioDe, type Cobro } from "@/lib/cobros-shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// "Mi abono": lo usan los administradores de cada local.
async function adminDelLocal(request: Request, slug: string) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  try {
    const email = ((await adminAuth.verifyIdToken(token)).email ?? "").toLowerCase();
    const [admin, sup] = await Promise.all([
      adminDb.doc(`tenants/${slug}/admins/${email}`).get(),
      adminDb.doc(`superadmins/${email}`).get(),
    ]);
    const ok = (admin.exists && admin.data()?.enabled === true) || (sup.exists && sup.data()?.enabled === true);
    return ok ? email : null;
  } catch {
    return null;
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  if (!(await adminDelLocal(request, tenantId))) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  const ref = adminDb.doc(`tenants/${tenantId}`);
  const [t, pagos] = await Promise.all([ref.get(), ref.collection("pagos").orderBy("fecha", "desc").limit(12).get()]);
  if (!t.exists) return NextResponse.json({ error: "No existe" }, { status: 404 });
  const data = t.data()!;
  const cobro: Cobro & { baja?: unknown } = data.cobro ?? {};
  const creado = data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString().slice(0, 10) : null;
  return NextResponse.json({
    nombre: data.name ?? tenantId,
    precio: precioDe(cobro),
    pagadoHasta: cobro.pagadoHasta ?? null,
    modo: cobro.modo ?? null,
    suspendido: cobro.suspendido === true,
    activo: data.active !== false,
    debito: data.subscription?.status === "authorized" ? "activo" : data.subscription?.status ?? null,
    baja: cobro.baja ?? null,
    // Arrepentimiento: 10 días corridos desde que contrató.
    puedeArrepentirse: creado ? diasEntre(creado, hoyAR()) <= 10 : false,
    pagos: pagos.docs.map((d) => {
      const p = d.data();
      return { fecha: p.fecha, desde: p.desde, hasta: p.hasta, monto: p.monto, medio: p.medio };
    }),
  });
}

export async function POST(request: Request, { params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const email = await adminDelLocal(request, tenantId);
  if (!email) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  const body = (await request.json().catch(() => ({}))) as { accion?: string; mpEmail?: string; motivo?: string };
  const ref = adminDb.doc(`tenants/${tenantId}`);
  const t = await ref.get();
  if (!t.exists) return NextResponse.json({ error: "No existe" }, { status: 404 });
  const data = t.data()!;
  const cobro: Cobro = data.cobro ?? {};

  if (body.accion === "activar") {
    const mpEmail = String(body.mpEmail ?? "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mpEmail)) {
      return NextResponse.json({ error: "Escribí el email de tu cuenta de Mercado Pago." }, { status: 400 });
    }
    // Si está al día, el primer débito sale en el próximo vencimiento; si debe, sale ahora.
    const alDia = cobro.pagadoHasta && cobro.pagadoHasta > hoyAR();
    try {
      const sub = await createSubscription(tenantId, mpEmail, precioDe(cobro), {
        inicio: alDia ? cobro.pagadoHasta : undefined,
        volverA: `${SITE}/admin/${tenantId}/abono?mp=1`,
      });
      await ref.set(
        { cobro: { ...(data.cobro ? {} : { modo: "manual" }), mpEmail }, updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
      );
      await registrarEvento(tenantId, "ajuste", `${email} empezó a activar el débito automático (${mpEmail}).`);
      return NextResponse.json({ pagoUrl: sub.init_point });
    } catch {
      return NextResponse.json({ error: "Mercado Pago no respondió. Probá de nuevo en un rato." }, { status: 502 });
    }
  }

  if (body.accion === "verificar") {
    try {
      const p = await findSubscription(tenantId);
      if (p) {
        const { syncSubscription } = await import("@/lib/mercadopago");
        await syncSubscription(p);
        if (p.status === "authorized" && data.subscription?.status !== "authorized") {
          await avisar(`débito automático activado: ${String(data.name ?? tenantId)}`, [`Lo activó ${email}.`]);
        }
      }
      return NextResponse.json({ estado: p?.status ?? "ninguno" });
    } catch {
      return NextResponse.json({ estado: "desconocido" });
    }
  }

  if (body.accion === "baja" || body.accion === "arrepentimiento") {
    const r = await bajaDesdePanel(tenantId, email, body.accion, String(body.motivo ?? ""));
    return NextResponse.json(r);
  }

  return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
}

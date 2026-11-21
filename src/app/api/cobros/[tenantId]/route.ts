import { NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { superadminDe } from "@/lib/superadmin-server";
import { enviarRecibo } from "@/lib/cobros";
import { guardarPago, registrarEvento, type MedioPago } from "@/lib/cobros-historial";
import { mpFetch } from "@/lib/mercadopago";
import { diasEntre, fechaLinda, hoyAR, pesos, precioDe, proximoVencimiento } from "@/lib/cobros-shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Historial y acciones de cobro de un local. Solo el superadmin.
const superadmin = superadminDe;

const ts = (v: unknown) => (v instanceof Timestamp ? v.toDate().toISOString() : null);

export async function GET(request: Request, { params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  if (!(await superadmin(request))) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const ref = adminDb.doc(`tenants/${tenantId}`);
  const [t, pagos, eventos] = await Promise.all([
    ref.get(),
    ref.collection("pagos").orderBy("fecha", "desc").limit(200).get(),
    ref.collection("eventos").orderBy("creadoEn", "desc").limit(100).get(),
  ]);
  if (!t.exists) return NextResponse.json({ error: "No existe" }, { status: 404 });

  const listaPagos = pagos.docs.map((d) => ({ id: d.id, ...d.data(), creadoEn: ts(d.data().creadoEn) }));
  const fechas = listaPagos.map((p) => String((p as { fecha?: string }).fecha ?? "")).filter(Boolean).sort();
  return NextResponse.json({
    clienteDesde: ts(t.data()?.createdAt)?.slice(0, 10) ?? fechas[0] ?? null,
    pagos: listaPagos,
    eventos: eventos.docs.map((d) => ({ id: d.id, ...d.data(), creadoEn: ts(d.data().creadoEn) })),
  });
}

export async function POST(request: Request, { params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const quien = await superadmin(request);
  if (!quien) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const body = (await request.json().catch(() => ({}))) as {
    accion?: string;
    base?: string;
    monto?: number;
    medio?: MedioPago;
    nota?: string;
    pagoId?: string;
    recibo?: boolean;
    modo?: string;
    autoCorte?: boolean;
    pagadoHasta?: string;
    email?: string;
    precio?: number;
  };
  const ref = adminDb.doc(`tenants/${tenantId}`);
  const t = await ref.get();
  if (!t.exists) return NextResponse.json({ error: "No existe" }, { status: 404 });
  const cobro = t.data()?.cobro ?? {};

  if (body.accion === "pago") {
    const base = /^\d{4}-\d{2}-\d{2}$/.test(body.base ?? "") ? body.base : cobro.pagadoHasta;
    const hasta = proximoVencimiento(base || undefined);
    // Mismo criterio que el vencimiento: sigue el ciclo si el atraso es de hasta 15 días.
    const desde = base && diasEntre(base, hoyAR()) <= 15 ? base : hoyAR();
    const monto = Number(body.monto) > 0 ? Math.round(Number(body.monto)) : precioDe(cobro);
    const medio: MedioPago = ["mp", "efectivo", "transferencia"].includes(String(body.medio))
      ? (body.medio as MedioPago)
      : "efectivo";
    await guardarPago(tenantId, {
      fecha: hoyAR(),
      desde,
      hasta,
      monto,
      medio,
      nota: String(body.nota ?? "").slice(0, 200),
    });
    await ref.set(
      {
        active: true,
        pending: false,
        cobro: { pagadoHasta: hasta, suspendido: false },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    await registrarEvento(
      tenantId,
      "pago",
      `Pago registrado: ${pesos(monto)} (${medio}). Vence el ${fechaLinda(hasta)}.${
        cobro.suspendido ? " Carta reactivada." : ""
      }`
    );
    const recibo = body.recibo === false ? null : await enviarRecibo(tenantId, { monto, medio, desde, hasta });
    return NextResponse.json({ ok: true, hasta, recibo });
  }

  if (body.accion === "ajustes") {
    const modo = body.modo === "mp" ? "mp" : "manual";
    const pagadoHasta = /^\d{4}-\d{2}-\d{2}$/.test(body.pagadoHasta ?? "") ? body.pagadoHasta : "";
    const email = String(body.email ?? "").trim().toLowerCase().slice(0, 120);
    const precio = Number(body.precio) > 0 ? Math.round(Number(body.precio)) : null;
    const autoCorte = body.autoCorte === true;
    if (autoCorte && !pagadoHasta) {
      return NextResponse.json({ error: "Cargá la fecha de vencimiento" }, { status: 400 });
    }
    await ref.set(
      {
        cobro: { modo, autoCorte, pagadoHasta, email, precio: precio ?? FieldValue.delete() },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    const cambios: string[] = [];
    if (cobro.pagadoHasta !== pagadoHasta) cambios.push(`vencimiento ${fechaLinda(pagadoHasta) || "sin fecha"}`);
    if ((cobro.precio ?? null) !== precio) cambios.push(`abono ${pesos(precio ?? precioDe({}))}`);
    if ((cobro.autoCorte === true) !== autoCorte) cambios.push(`avisos ${autoCorte ? "activados" : "apagados"}`);
    if (cambios.length) await registrarEvento(tenantId, "ajuste", `Cambios: ${cambios.join(", ")}.`);

    // Si cobra por Mercado Pago y cambió el precio, se actualiza la suscripción.
    let mp: string | null = null;
    const subId = t.data()?.subscription?.id;
    if (modo === "mp" && subId && (cobro.precio ?? null) !== precio && t.data()?.subscription?.status === "authorized") {
      try {
        await mpFetch(`/preapproval/${subId}`, {
          method: "PUT",
          body: JSON.stringify({
            auto_recurring: { transaction_amount: precio ?? precioDe({}), currency_id: "ARS" },
          }),
        });
        mp = "ok";
      } catch {
        mp = "error";
      }
    }
    return NextResponse.json({ ok: true, mp });
  }

  if (body.accion === "pausar" || body.accion === "reactivar") {
    const pausar = body.accion === "pausar";
    await ref.set(
      {
        active: !pausar,
        ...(pausar ? {} : { pending: false }),
        cobro: { suspendido: pausar },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    await registrarEvento(tenantId, pausar ? "pausa" : "reactivacion", pausar ? "Pausada a mano." : "Reactivada a mano.");
    return NextResponse.json({ ok: true });
  }

  if (body.accion === "borrarPago" && body.pagoId && /^[\w-]{1,80}$/.test(body.pagoId)) {
    const p = ref.collection("pagos").doc(body.pagoId);
    const d = await p.get();
    if (d.exists) {
      await p.delete();
      await registrarEvento(
        tenantId,
        "pago",
        `Se borró del historial el pago del ${fechaLinda(String(d.data()?.fecha ?? ""))} ($${Number(
          d.data()?.monto ?? 0
        ).toLocaleString("es-AR")}). El vencimiento no cambia.`
      );
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
}

// Historial de cobros de cada local: pagos (tenants/{id}/pagos) y eventos (tenants/{id}/eventos).
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";

export type MedioPago = "mp" | "efectivo" | "transferencia";

export async function registrarEvento(slug: string, tipo: string, detalle: string) {
  try {
    await adminDb.collection(`tenants/${slug}/eventos`).add({
      tipo,
      detalle,
      creadoEn: FieldValue.serverTimestamp(),
    });
  } catch (e) {
    console.error("Evento de cobro", slug, e);
  }
}

// Guarda una cuota pagada. Con id fijo no se duplica (pagos de Mercado Pago).
export async function guardarPago(
  slug: string,
  pago: { fecha: string; desde: string; hasta: string; monto: number; medio: MedioPago; nota?: string },
  id?: string
) {
  const col = adminDb.collection(`tenants/${slug}/pagos`);
  const ref = id ? col.doc(id) : col.doc();
  if (id && (await ref.get()).exists) return false;
  await ref.set({ ...pago, nota: pago.nota ?? "", creadoEn: FieldValue.serverTimestamp() });
  return true;
}

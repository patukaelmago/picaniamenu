// Mercado Pago: abono mensual de los locales que se registran solos.
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { avisar } from "@/lib/avisos";

export const ABONO_MENSUAL_ARS = 25000;
export const SITE = "https://carta-online.com";

export type Preapproval = {
  id: string;
  status: string; // pending | authorized | paused | cancelled
  external_reference?: string;
  payer_email?: string;
  init_point?: string;
  date_created?: string;
};

export async function mpFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) throw new Error("Falta MP_ACCESS_TOKEN");
  const res = await fetch(`https://api.mercadopago.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("Mercado Pago", path, res.status, JSON.stringify(data).slice(0, 500));
    throw new Error(`Mercado Pago respondió ${res.status}`);
  }
  return data as T;
}

export function createSubscription(slug: string, payerEmail: string) {
  return mpFetch<Preapproval>("/preapproval", {
    method: "POST",
    body: JSON.stringify({
      reason: "Carta Online - abono mensual",
      external_reference: slug,
      payer_email: payerEmail,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: ABONO_MENSUAL_ARS,
        currency_id: "ARS",
      },
      back_url: `${SITE}/registro/listo?local=${encodeURIComponent(slug)}`,
      status: "pending",
    }),
  });
}

// Busca la suscripción más reciente de un local.
export async function findSubscription(slug: string): Promise<Preapproval | null> {
  const res = await mpFetch<{ results?: Preapproval[] }>(
    `/preapproval/search?external_reference=${encodeURIComponent(slug)}&limit=20`
  );
  const results = res.results ?? [];
  const authorized = results.find((p) => p.status === "authorized");
  if (authorized) return authorized;
  return (
    results.sort((a, b) => String(b.date_created ?? "").localeCompare(String(a.date_created ?? "")))[0] ??
    null
  );
}

// Aplica el estado de la suscripción al local: pagada = publicada; cancelada o pausada = sin publicar.
// Solo toca locales que se registraron solos (tienen ownerEmail); nunca los creados a mano.
export async function syncSubscription(p: Preapproval) {
  const slug = p.external_reference;
  if (!slug) return null;
  const ref = adminDb.doc(`tenants/${slug}`);
  const snap = await ref.get();
  if (!snap.exists || !snap.data()?.ownerEmail) return null;

  const update: Record<string, unknown> = {
    subscription: { id: p.id, status: p.status, updatedAt: FieldValue.serverTimestamp() },
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (p.status === "authorized") {
    update.active = true;
    update.pending = false;
  } else if (p.status === "cancelled" || p.status === "paused") {
    // Si estaba publicada y la cancelan, la carta deja de verse.
    if (snap.data()?.subscription?.id === p.id || snap.data()?.active === true) update.active = false;
  }
  await ref.set(update, { merge: true });

  // Aviso por mail solo cuando el estado cambia.
  const before = snap.data()?.subscription?.status;
  if (before !== p.status && ["authorized", "cancelled", "paused"].includes(p.status)) {
    const nombre = String(snap.data()?.name ?? slug);
    const titulo =
      p.status === "authorized"
        ? `pago acreditado: ${nombre}`
        : `suscripción ${p.status === "paused" ? "pausada" : "cancelada"}: ${nombre}`;
    await avisar(titulo, [
      p.status === "authorized"
        ? "Se acreditó el abono y la carta quedó publicada."
        : "La carta dejó de verse por el QR.",
      ``,
      `Carta: https://carta-online.com/menu/${slug}`,
      `Cuenta: ${snap.data()?.ownerEmail ?? ""}`,
    ]);
  }
  return { slug, active: update.active ?? snap.data()?.active === true, status: p.status };
}

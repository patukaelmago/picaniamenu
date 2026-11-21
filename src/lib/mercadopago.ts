// Mercado Pago: abono mensual de los locales que se registran solos.
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { avisar } from "@/lib/avisos";
import { guardarPago, registrarEvento } from "@/lib/cobros-historial";
import { DIA_CORTE, PRECIO_BASE, diasEntre, hoyAR, sumarMes, type Cobro } from "@/lib/cobros-shared";

export const ABONO_MENSUAL_ARS = PRECIO_BASE;
export const SITE = "https://carta-online.com";

export type Preapproval = {
  id: string;
  status: string; // pending | authorized | paused | cancelled
  external_reference?: string;
  payer_email?: string;
  init_point?: string;
  date_created?: string;
  next_payment_date?: string;
  summarized?: {
    last_charged_date?: string | null;
    last_charged_amount?: number | null;
    charged_quantity?: number | null;
  };
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

export function createSubscription(slug: string, payerEmail: string, monto = ABONO_MENSUAL_ARS) {
  return mpFetch<Preapproval>("/preapproval", {
    method: "POST",
    body: JSON.stringify({
      reason: "Carta Online - abono mensual",
      external_reference: slug,
      payer_email: payerEmail,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: monto,
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

// Aplica el estado de la suscripción al local. El vencimiento sale del último cobro acreditado;
// los avisos y el corte por atraso los maneja la revisión diaria (src/lib/cobros.ts).
// Solo toca locales que se registraron solos (tienen ownerEmail); nunca los creados a mano.
export async function syncSubscription(p: Preapproval) {
  const slug = p.external_reference;
  if (!slug) return null;
  const ref = adminDb.doc(`tenants/${slug}`);
  const snap = await ref.get();
  if (!snap.exists || !snap.data()?.ownerEmail) return null;
  const prevCobro: Cobro = snap.data()?.cobro ?? {};
  const actual = snap.data()?.subscription;

  // Una suscripción vieja o sin terminar no pisa a la que está pagando.
  if (p.status !== "authorized" && actual?.status === "authorized" && actual?.id !== p.id) {
    return { slug, active: snap.data()?.active === true, status: p.status };
  }

  const update: Record<string, unknown> = {
    subscription: { id: p.id, status: p.status, updatedAt: FieldValue.serverTimestamp() },
    updatedAt: FieldValue.serverTimestamp(),
  };
  const cobro: Record<string, unknown> = { modo: "mp" };
  if (prevCobro.autoCorte === undefined) cobro.autoCorte = true;

  if (p.status === "authorized") {
    const ultimo = p.summarized?.last_charged_date?.slice(0, 10);
    let pagadoHasta = ultimo ? sumarMes(ultimo) : prevCobro.pagadoHasta;
    if (!pagadoHasta) pagadoHasta = sumarMes(String(p.date_created ?? new Date().toISOString()).slice(0, 10));
    if (prevCobro.pagadoHasta && prevCobro.pagadoHasta > pagadoHasta) pagadoHasta = prevCobro.pagadoHasta;
    cobro.pagadoHasta = pagadoHasta;

    const atraso = diasEntre(pagadoHasta, hoyAR()) - 1;
    if (atraso < DIA_CORTE) {
      update.active = true;
      update.pending = false;
      cobro.suspendido = false;
    }
  } else if (p.status === "cancelled" || p.status === "paused") {
    // Si nunca pagó, la carta no se ve. Si ya pagaba, sigue hasta el vencimiento y después
    // corren los avisos y el corte de la revisión diaria.
    if (!prevCobro.pagadoHasta) update.active = false;
  }
  update.cobro = cobro;
  await ref.set(update, { merge: true });

  // Historial: cada cobro acreditado queda como una cuota pagada.
  const ultimoCobro = p.status === "authorized" ? p.summarized?.last_charged_date?.slice(0, 10) : undefined;
  if (ultimoCobro) {
    const nueva = await guardarPago(
      slug,
      {
        fecha: ultimoCobro,
        desde: ultimoCobro,
        hasta: sumarMes(ultimoCobro),
        monto: Number(p.summarized?.last_charged_amount ?? ABONO_MENSUAL_ARS),
        medio: "mp",
        nota: "Cobro automático de Mercado Pago",
      },
      `mp-${p.id}-${ultimoCobro}`
    );
    if (nueva) {
      await registrarEvento(slug, "pago", `Mercado Pago cobró el abono del ${ultimoCobro}.`);
      const { enviarRecibo } = await import("@/lib/cobros");
      await enviarRecibo(slug, {
        monto: Number(p.summarized?.last_charged_amount ?? ABONO_MENSUAL_ARS),
        medio: "mp",
        desde: ultimoCobro,
        hasta: sumarMes(ultimoCobro),
      });
    }
  }
  if (prevCobro.suspendido && cobro.suspendido === false) {
    await registrarEvento(slug, "reactivacion", "Carta reactivada al acreditarse el pago.");
  }

  const before = actual?.status;

  // Si pagó con una suscripción nueva, se cancelan las anteriores para no cobrarle dos veces.
  if (p.status === "authorized" && (before !== "authorized" || actual?.id !== p.id)) {
    try {
      const res = await mpFetch<{ results?: Preapproval[] }>(
        `/preapproval/search?external_reference=${encodeURIComponent(slug)}&limit=20`
      );
      for (const otra of res.results ?? []) {
        if (otra.id !== p.id && ["authorized", "paused"].includes(otra.status)) {
          await mpFetch(`/preapproval/${otra.id}`, {
            method: "PUT",
            body: JSON.stringify({ status: "cancelled" }),
          });
        }
      }
    } catch (e) {
      console.error("Cancelar suscripciones viejas", slug, e);
    }
  }

  // Aviso por mail solo cuando el estado cambia.
  if (before !== p.status && ["authorized", "cancelled", "paused"].includes(p.status)) {
    const nombre = String(snap.data()?.name ?? slug);
    const titulo =
      p.status === "authorized"
        ? `pago acreditado: ${nombre}`
        : `suscripción ${p.status === "paused" ? "pausada" : "cancelada"}: ${nombre}`;
    await avisar(titulo, [
      p.status === "authorized"
        ? "Se acreditó el abono y la carta quedó publicada."
        : update.active === false
          ? "La carta dejó de verse por el QR."
          : "La carta sigue visible hasta el vencimiento; después corren los avisos y el corte.",
      ``,
      `Carta: https://carta-online.com/menu/${slug}`,
      `Cuenta: ${snap.data()?.ownerEmail ?? ""}`,
    ]);
  }
  return { slug, active: update.active ?? snap.data()?.active === true, status: p.status };
}

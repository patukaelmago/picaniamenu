// Botón de baja y botón de arrepentimiento (Disposición SSDCyLC 954/2025 y normas anteriores).
// Cualquiera puede pedirlo sin iniciar sesión; se confirma con un link al email para evitar bajas ajenas.
import crypto from "crypto";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { avisar, enviarMail } from "@/lib/avisos";
import { registrarEvento } from "@/lib/cobros-historial";
import { mpFetch, SITE, type Preapproval } from "@/lib/mercadopago";
import { fechaLinda, hoyAR } from "@/lib/cobros-shared";

export type TipoBaja = "baja" | "arrepentimiento";
const NOMBRE: Record<TipoBaja, string> = { baja: "baja del servicio", arrepentimiento: "arrepentimiento" };

function codigoNuevo(tipo: TipoBaja) {
  const n = crypto.randomInt(0, 36 ** 6).toString(36).toUpperCase().padStart(6, "0");
  return `${tipo === "baja" ? "BAJA" : "ARR"}-${n}`;
}

// Locales donde ese email es dueño, contacto de cobro o administrador.
async function localesDe(email: string) {
  const snap = await adminDb.collection("tenants").get();
  const ids: string[] = [];
  for (const d of snap.docs) {
    const data = d.data();
    if (data.ownerEmail === email || data.cobro?.email === email) {
      ids.push(d.id);
      continue;
    }
    const admin = await d.ref.collection("admins").doc(email).get();
    if (admin.exists && admin.data()?.enabled === true) ids.push(d.id);
  }
  return ids;
}

export async function pedirBaja(tipo: TipoBaja, emailCrudo: string, local: string, motivo: string) {
  const email = emailCrudo.trim().toLowerCase();
  const codigo = codigoNuevo(tipo);
  const token = crypto.randomBytes(24).toString("hex");
  const tenantIds = await localesDe(email);

  await adminDb.doc(`bajas/${codigo}`).set({
    codigo,
    tipo,
    email,
    local: local.slice(0, 120),
    motivo: motivo.slice(0, 500),
    tenantIds,
    token,
    estado: tenantIds.length ? "pendiente" : "sin_cuenta",
    creadoEn: FieldValue.serverTimestamp(),
  });

  const link = `${SITE}/baja/confirmar?codigo=${codigo}&token=${token}`;
  await enviarMail(email, `Tu solicitud de ${NOMBRE[tipo]} - ${codigo}`, [
    `Hola,`,
    ``,
    `Recibimos tu solicitud de ${NOMBRE[tipo]} de Carta Online.`,
    `Código de la solicitud: ${codigo}`,
    ``,
    tenantIds.length
      ? `Para confirmarla, entrá a este link: ${link}`
      : `No encontramos un local asociado a este email. Respondé este mail indicando el nombre de tu local y la procesamos a mano.`,
    ``,
    `Si no la pediste vos, ignorá este mail.`,
    ``,
    `Carta Online`,
  ]);
  await avisar(`solicitud de ${NOMBRE[tipo]}: ${codigo}`, [
    `Email: ${email}`,
    `Local indicado: ${local || "(no indicó)"}`,
    `Locales encontrados: ${tenantIds.join(", ") || "ninguno"}`,
    `Motivo: ${motivo || "(no indicó)"}`,
    `Queda pendiente hasta que confirme desde el mail.`,
  ]);
  return codigo;
}

async function cancelarSuscripcion(slug: string, data: FirebaseFirestore.DocumentData) {
  const ids = new Set<string>();
  if (data.subscription?.id) ids.add(data.subscription.id);
  try {
    const res = await mpFetch<{ results?: Preapproval[] }>(
      `/preapproval/search?external_reference=${encodeURIComponent(slug)}&limit=20`
    );
    for (const p of res.results ?? []) if (["authorized", "paused", "pending"].includes(p.status)) ids.add(p.id);
  } catch {
    /* sin suscripciones en Mercado Pago */
  }
  let canceladas = 0;
  for (const id of ids) {
    try {
      await mpFetch(`/preapproval/${id}`, { method: "PUT", body: JSON.stringify({ status: "cancelled" }) });
      canceladas++;
    } catch (e) {
      console.error("Baja: cancelar suscripción", slug, id, e);
    }
  }
  return canceladas;
}

export async function confirmarBaja(codigo: string, token: string) {
  const ref = adminDb.doc(`bajas/${codigo}`);
  const snap = await ref.get();
  const s = snap.data();
  if (!snap.exists || !s || s.token !== token) return { ok: false as const, error: "El link no es válido." };
  if (s.estado === "confirmada") return { ok: true as const, codigo, tipo: s.tipo as TipoBaja, yaEstaba: true };
  if (s.estado !== "pendiente") return { ok: false as const, error: "Esta solicitud no se puede confirmar desde acá." };

  const tipo = s.tipo as TipoBaja;
  const hoy = hoyAR();
  const detalle: string[] = [];
  for (const slug of s.tenantIds as string[]) {
    const tRef = adminDb.doc(`tenants/${slug}`);
    const t = await tRef.get();
    if (!t.exists) continue;
    const data = t.data()!;
    const canceladas = await cancelarSuscripcion(slug, data);
    // Baja: sigue visible hasta el fin del período pago. Arrepentimiento: se corta hoy.
    const pagado = data.cobro?.pagadoHasta as string | undefined;
    const efectivaEl = tipo === "baja" && pagado && pagado > hoy ? pagado : hoy;
    const cortaHoy = efectivaEl <= hoy;
    await tRef.set(
      {
        ...(cortaHoy ? { active: false } : {}),
        cobro: {
          autoCorte: false,
          baja: { codigo, tipo, pedidaEl: hoy, efectivaEl, pendiente: !cortaHoy },
        },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    const linea = `${NOMBRE[tipo]} confirmada (${codigo}). ${
      cortaHoy ? "Carta dada de baja hoy." : `La carta sigue visible hasta el ${fechaLinda(efectivaEl)}.`
    }${canceladas ? ` Se cancelaron ${canceladas} débitos de Mercado Pago.` : ""}`;
    await registrarEvento(slug, "baja", linea[0].toUpperCase() + linea.slice(1));
    detalle.push(`${String(data.name ?? slug)}: ${linea}`);
  }
  await ref.set({ estado: "confirmada", confirmadoEn: FieldValue.serverTimestamp(), detalle }, { merge: true });

  await enviarMail(s.email, `Confirmamos tu ${NOMBRE[tipo]} - ${codigo}`, [
    `Hola,`,
    ``,
    `Confirmamos tu solicitud de ${NOMBRE[tipo]} de Carta Online (código ${codigo}).`,
    ...detalle.map((d) => `- ${d}`),
    `No se te va a volver a debitar el abono.`,
    ...(tipo === "arrepentimiento"
      ? [``, `Como ejerciste el derecho de arrepentimiento, te vamos a devolver lo que pagaste. Te escribimos para coordinarlo.`]
      : []),
    ``,
    `Carta Online`,
  ]);
  await avisar(`${NOMBRE[tipo]} CONFIRMADA: ${codigo}`, [
    `Email: ${s.email}`,
    ...detalle,
    ...(tipo === "arrepentimiento" ? [``, `OJO: hay que devolverle lo que pagó (10 días de arrepentimiento).`] : []),
  ]);
  return { ok: true as const, codigo, tipo, yaEstaba: false };
}

// Revisión diaria: corta las cartas cuya baja llegó a la fecha.
export async function aplicarBajasPendientes(hoy = hoyAR()) {
  const snap = await adminDb.collection("tenants").where("cobro.baja.pendiente", "==", true).get();
  const hechos: string[] = [];
  for (const d of snap.docs) {
    const baja = d.data().cobro?.baja;
    if (!baja?.efectivaEl || baja.efectivaEl > hoy) continue;
    await d.ref.set({ active: false, cobro: { baja: { pendiente: false } } }, { merge: true });
    await registrarEvento(d.id, "baja", `Baja efectiva (${baja.codigo}): la carta dejó de estar publicada.`);
    hechos.push(`${d.id}: baja efectiva`);
  }
  return hechos;
}

// Baja pedida desde el panel del local (con sesión iniciada): no hace falta confirmar por mail.
export async function bajaDesdePanel(slug: string, email: string, tipo: TipoBaja, motivo = "") {
  const codigo = codigoNuevo(tipo);
  const token = crypto.randomBytes(24).toString("hex");
  await adminDb.doc(`bajas/${codigo}`).set({
    codigo,
    tipo,
    email,
    local: slug,
    motivo: motivo.slice(0, 500),
    tenantIds: [slug],
    token,
    estado: "pendiente",
    desdePanel: true,
    creadoEn: FieldValue.serverTimestamp(),
  });
  return confirmarBaja(codigo, token);
}

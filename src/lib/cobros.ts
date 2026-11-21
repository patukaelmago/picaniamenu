// Avisos y corte automáticos por falta de pago. Corre una vez por día.
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { avisar, enviarMail } from "@/lib/avisos";
import { findSubscription, syncSubscription, SITE, ABONO_MENSUAL_ARS } from "@/lib/mercadopago";
import { DIAS_AVISO, DIA_CORTE, diasEntre, fechaLinda, hoyAR, type Cobro } from "@/lib/cobros-shared";

const WHATSAPP = "https://wa.me/5493417510112";
const precio = `$${ABONO_MENSUAL_ARS.toLocaleString("es-AR")}`;

// Días de atraso. En Mercado Pago se da un día extra para que el cobro del día se acredite.
export function diasDeAtraso(cobro: Cobro, hoy = hoyAR()) {
  if (!cobro.pagadoHasta) return null;
  return diasEntre(cobro.pagadoHasta, hoy) - (cobro.modo === "mp" ? 1 : 0);
}

function textoAviso(nombre: string, cobro: Cobro, etapa: number, slug: string) {
  const mp = cobro.modo === "mp";
  const pagar = mp
    ? [`Podés pagar o cambiar la tarjeta acá: ${SITE}/registro?pagar=1`]
    : [`Para regularizar, escribinos por WhatsApp: ${WHATSAPP}`, `o respondé este mail.`];
  const vence = fechaLinda(cobro.pagadoHasta);
  const corte = DIA_CORTE - etapa;

  if (etapa === 0) {
    return {
      asunto: mp ? `No pudimos cobrar el abono de ${nombre}` : `Hoy vence el abono de ${nombre}`,
      lineas: [
        `Hola,`,
        ``,
        mp
          ? `No pudimos cobrar el abono mensual de Carta Online (${precio}) de ${nombre}.`
          : `Hoy (${vence}) vence el abono mensual de Carta Online (${precio}) de ${nombre}.`,
        `Si en ${corte} días no está pago, la carta se pausa y deja de verse por el QR.`,
        ``,
        ...pagar,
        ``,
        `Carta Online`,
      ],
    };
  }
  if (etapa < DIAS_AVISO[DIAS_AVISO.length - 1]) {
    return {
      asunto: `Recordatorio: abono pendiente de ${nombre}`,
      lineas: [
        `Hola,`,
        ``,
        `Seguimos sin registrar el pago del abono de Carta Online de ${nombre} (venció el ${vence}).`,
        `En ${corte} días la carta se pausa y deja de verse por el QR.`,
        ``,
        ...pagar,
        ``,
        `Carta Online`,
      ],
    };
  }
  return {
    asunto: `Último aviso: mañana se pausa la carta de ${nombre}`,
    lineas: [
      `Hola,`,
      ``,
      `El abono de Carta Online de ${nombre} sigue pendiente (venció el ${vence}).`,
      `Mañana la carta se pausa y tus clientes no la van a poder ver por el QR.`,
      `No se borra nada: cuando se registre el pago vuelve a verse igual que antes.`,
      ``,
      ...pagar,
      ``,
      `Carta Online`,
    ],
  };
}

async function procesarLocal(slug: string, data: FirebaseFirestore.DocumentData, hoy: string) {
  let cobro: Cobro = data.cobro ?? {};
  if (!cobro.autoCorte) return null;

  // Mercado Pago: actualizar el vencimiento con el último cobro acreditado.
  if (cobro.modo === "mp") {
    try {
      const p = await findSubscription(slug);
      if (p) await syncSubscription(p);
      const fresh = await adminDb.doc(`tenants/${slug}`).get();
      cobro = fresh.data()?.cobro ?? cobro;
    } catch (e) {
      console.error("Cobros MP", slug, e);
    }
  }

  const atraso = diasDeAtraso(cobro, hoy);
  if (atraso === null || atraso < 0) return null;

  const ref = adminDb.doc(`tenants/${slug}`);
  const nombre = String(data.name ?? slug);
  const para = String(cobro.email || data.ownerEmail || "").trim();
  const ciclo = cobro.pagadoHasta!;

  if (atraso >= DIA_CORTE) {
    if (cobro.suspendido) return null;
    await ref.set(
      {
        active: false,
        cobro: { suspendido: true, suspendidoEl: hoy },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    const enviado = await enviarMail(para, `La carta de ${nombre} está pausada`, [
      `Hola,`,
      ``,
      `Como el abono de Carta Online sigue pendiente, la carta de ${nombre} quedó pausada y no se ve por el QR.`,
      `No se borró nada: cuando se registre el pago vuelve a verse igual que antes.`,
      ``,
      ...(cobro.modo === "mp"
        ? [`Podés pagar acá: ${SITE}/registro?pagar=1`]
        : [`Para regularizar, escribinos por WhatsApp: ${WHATSAPP}`]),
      ``,
      `Carta Online`,
    ]);
    if (!enviado) {
      await avisar(`no salió el aviso de pausa: ${nombre}`, [
        `La carta de ${slug} se pausó pero no se pudo mandar el mail a "${para || "(sin email)"}".`,
      ]);
    }
    return `${slug}: pausada`;
  }

  const etapa = [...DIAS_AVISO].reverse().find((d) => atraso >= d);
  if (etapa === undefined) return null;
  const yaAvisado = cobro.aviso?.ciclo === ciclo && cobro.aviso.etapa >= etapa;
  if (yaAvisado) return null;

  const { asunto, lineas } = textoAviso(nombre, cobro, etapa, slug);
  const ok = await enviarMail(para, asunto, lineas);
  if (!ok) {
    await avisar(`no salió el aviso de cobro: ${nombre}`, [
      `No se pudo mandar el aviso del día ${etapa} a "${para || "(sin email)"}".`,
      `Local: ${slug}`,
    ]);
  }
  await ref.set({ cobro: { aviso: { ciclo, etapa } } }, { merge: true });
  return `${slug}: aviso día ${etapa}`;
}

// Revisa todos los locales. Se ejecuta como máximo una vez cada 20 horas.
export async function revisarCobros({ forzar = false } = {}) {
  const lockRef = adminDb.doc("sistema/cobros");
  const ahora = Date.now();
  const puede = await adminDb.runTransaction(async (tx) => {
    const lock = await tx.get(lockRef);
    const ultima = Number(lock.data()?.ultimaRevision ?? 0);
    if (!forzar && ahora - ultima < 20 * 60 * 60 * 1000) return false;
    tx.set(lockRef, { ultimaRevision: ahora }, { merge: true });
    return true;
  });
  if (!puede) return { ejecutado: false, resultados: [] as string[] };

  const hoy = hoyAR(ahora);
  const snap = await adminDb.collection("tenants").where("cobro.autoCorte", "==", true).get();
  const resultados: string[] = [];
  for (const d of snap.docs) {
    try {
      const r = await procesarLocal(d.id, d.data(), hoy);
      if (r) resultados.push(r);
    } catch (e) {
      console.error("Cobros", d.id, e);
      resultados.push(`${d.id}: error`);
    }
  }
  await lockRef.set({ ultimoResultado: resultados, ultimaFecha: hoy }, { merge: true });
  return { ejecutado: true, resultados };
}

// Avisos y corte automáticos por falta de pago. Corre una vez por día.
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { avisar, enviarMail } from "@/lib/avisos";
import { registrarEvento } from "@/lib/cobros-historial";
import { findSubscription, syncSubscription, SITE } from "@/lib/mercadopago";
import {
  DIAS_ANTES,
  DIAS_AVISO,
  DIA_CORTE,
  diasEntre,
  fechaLinda,
  hoyAR,
  pesos,
  precioDe,
  type Cobro,
} from "@/lib/cobros-shared";

const WHATSAPP = "https://wa.me/5493417510112";
const MEDIOS: Record<string, string> = { mp: "Mercado Pago", efectivo: "efectivo", transferencia: "transferencia" };

function destinatario(data: FirebaseFirestore.DocumentData | undefined) {
  return String(data?.cobro?.email || data?.ownerEmail || "").trim();
}

// Recibo por mail al cliente cuando se registra un pago.
export async function enviarRecibo(
  slug: string,
  pago: { monto: number; medio: string; desde: string; hasta: string }
) {
  const snap = await adminDb.doc(`tenants/${slug}`).get();
  const para = destinatario(snap.data());
  if (!para) return false;
  const nombre = String(snap.data()?.name ?? slug);
  const ok = await enviarMail(para, `Recibo de pago - ${nombre}`, [
    `Hola,`,
    ``,
    `Registramos el pago del abono de Carta Online de ${nombre}. ¡Gracias!`,
    ``,
    `Monto: ${pesos(pago.monto)}`,
    `Medio: ${MEDIOS[pago.medio] ?? pago.medio}`,
    `Período: ${fechaLinda(pago.desde)} al ${fechaLinda(pago.hasta)}`,
    `Próximo vencimiento: ${fechaLinda(pago.hasta)}`,
    ``,
    `Carta Online`,
  ]);
  await registrarEvento(slug, "aviso", `Recibo ${ok ? `enviado a ${para}` : "NO enviado"}.`);
  return ok;
}

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
  const precio = pesos(precioDe(cobro));

  if (etapa < 0) {
    return {
      asunto: `El abono de ${nombre} vence el ${vence}`,
      lineas: [
        `Hola,`,
        ``,
        `Te recordamos que el ${vence} vence el abono mensual de Carta Online (${precio}) de ${nombre}.`,
        ``,
        `Para pagar, escribinos por WhatsApp: ${WHATSAPP}`,
        `o respondé este mail.`,
        ``,
        `Carta Online`,
      ],
    };
  }

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
  if (atraso === null) return null;
  // Antes del vencimiento solo va el recordatorio, y solo en cobro manual (Mercado Pago debita solo).
  if (atraso < 0 && (cobro.modo === "mp" || atraso < -DIAS_ANTES)) return null;

  const ref = adminDb.doc(`tenants/${slug}`);
  const nombre = String(data.name ?? slug);
  const para = destinatario({ ...data, cobro });
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
    await registrarEvento(
      slug,
      "pausa",
      `Carta pausada por falta de pago (venció el ${fechaLinda(ciclo)}). Mail ${enviado ? `enviado a ${para}` : "NO enviado"}.`
    );
    if (!enviado) {
      await avisar(`no salió el aviso de pausa: ${nombre}`, [
        `La carta de ${slug} se pausó pero no se pudo mandar el mail a "${para || "(sin email)"}".`,
      ]);
    }
    return `${slug}: pausada`;
  }

  const etapa = [-DIAS_ANTES, ...DIAS_AVISO].reverse().find((d) => atraso >= d);
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
  await registrarEvento(
    slug,
    "aviso",
    `${etapa < 0 ? "Recordatorio previo" : `Aviso día ${etapa}`}: "${asunto}" ${ok ? `enviado a ${para}` : "NO enviado"}.`
  );
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
  // El día 1 de cada mes, resumen del mes anterior para el dueño de Carta Online.
  const mesAnterior = (() => {
    const [y, m] = hoy.split("-").map(Number);
    const d = new Date(Date.UTC(y, m - 2, 1));
    return d.toISOString().slice(0, 7);
  })();
  const lockData = (await lockRef.get()).data() ?? {};
  if (hoy.endsWith("-01") && lockData.ultimoResumen !== mesAnterior) {
    try {
      await enviarResumenMensual(mesAnterior, hoy);
      await lockRef.set({ ultimoResumen: mesAnterior }, { merge: true });
      resultados.push(`resumen ${mesAnterior} enviado`);
    } catch (e) {
      console.error("Resumen mensual", e);
    }
  }

  await lockRef.set({ ultimoResultado: resultados, ultimaFecha: hoy }, { merge: true });
  return { ejecutado: true, resultados };
}

// Estado de cobro de todos los locales (para la pantalla general y el resumen mensual).
export async function estadoDeCobros(hoy = hoyAR()) {
  const snap = await adminDb.collection("tenants").get();
  const mes = hoy.slice(0, 7);
  const locales = await Promise.all(
    snap.docs.map(async (d) => {
      const data = d.data();
      const cobro: Cobro = data.cobro ?? {};
      const pagos = await d.ref.collection("pagos").orderBy("fecha", "desc").limit(200).get();
      const lista = pagos.docs.map((p) => p.data() as { fecha: string; monto: number; medio?: string });
      const atraso = diasDeAtraso(cobro, hoy);
      const precio = precioDe(cobro);
      // Cuotas vencidas sin pagar: una por cada mes desde el vencimiento.
      let cuotasDebe = 0;
      if (atraso !== null && atraso >= 0 && cobro.pagadoHasta) {
        const [y1, m1, d1] = cobro.pagadoHasta.split("-").map(Number);
        const [y2, m2, d2] = hoy.split("-").map(Number);
        cuotasDebe = (y2 - y1) * 12 + (m2 - m1) + (d2 >= d1 ? 1 : 0);
        if (cuotasDebe < 1) cuotasDebe = 1;
      }
      return {
        id: d.id,
        nombre: String(data.name ?? d.id),
        activo: data.active !== false,
        pendiente: data.pending === true && data.active !== true,
        modo: cobro.modo ?? null,
        autoCorte: cobro.autoCorte === true,
        suspendido: cobro.suspendido === true,
        pagadoHasta: cobro.pagadoHasta ?? null,
        atraso,
        precio,
        debe: cuotasDebe * precio,
        ultimoPago: lista[0]?.fecha ?? null,
        totalPagado: lista.reduce((a, p) => a + (Number(p.monto) || 0), 0),
        cobradoMes: lista.filter((p) => p.fecha?.startsWith(mes)).reduce((a, p) => a + (Number(p.monto) || 0), 0),
        pagos: lista,
      };
    })
  );
  return locales.sort((a, b) => (b.atraso ?? -999) - (a.atraso ?? -999));
}

async function enviarResumenMensual(mes: string, hoy: string) {
  const locales = await estadoDeCobros(hoy);
  const [y, m] = mes.split("-");
  const delMes = locales
    .map((l) => ({
      nombre: l.nombre,
      total: l.pagos.filter((p) => p.fecha?.startsWith(mes)).reduce((a, p) => a + (Number(p.monto) || 0), 0),
    }))
    .filter((l) => l.total > 0);
  const total = delMes.reduce((a, l) => a + l.total, 0);
  const atrasados = locales.filter((l) => l.suspendido || (l.atraso !== null && l.atraso >= 0 && l.pagadoHasta));
  await avisar(`resumen de cobros ${m}/${y}`, [
    `Cobrado en ${m}/${y}: ${pesos(total)}`,
    ...delMes.map((l) => `  - ${l.nombre}: ${pesos(l.total)}`),
    ``,
    atrasados.length ? `Atrasados o pausados (${atrasados.length}):` : `No hay locales atrasados.`,
    ...atrasados.map(
      (l) =>
        `  - ${l.nombre}: ${l.suspendido ? "pausada" : `${l.atraso} días`} (venció el ${fechaLinda(
          l.pagadoHasta ?? ""
        )}), debe ${pesos(l.debe)}`
    ),
    ``,
    `Detalle: ${SITE}/dashboard/cobros`,
  ]);
}

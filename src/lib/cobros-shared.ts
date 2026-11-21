// Cobro del abono de cada local: datos y fechas (se usa en el panel y en el servidor).

export type CobroModo = "mp" | "manual";

export type Cobro = {
  modo?: CobroModo; // mp = Mercado Pago automático; manual = efectivo o transferencia
  autoCorte?: boolean; // avisos y corte automáticos
  pagadoHasta?: string; // "AAAA-MM-DD": vence ese día
  email?: string; // a dónde van los avisos (si no, el dueño del local)
  suspendido?: boolean; // carta pausada por falta de pago
  aviso?: { ciclo: string; etapa: number }; // último aviso enviado para ese vencimiento
};

// Días desde el vencimiento en que se avisa, y día en que se pausa.
export const DIAS_AVISO = [0, 3, 7];
export const DIA_CORTE = 8;

// Fecha de hoy en Argentina ("AAAA-MM-DD").
export function hoyAR(now = Date.now()) {
  return new Date(now - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function toUTC(fecha: string) {
  const [y, m, d] = fecha.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export function diasEntre(desde: string, hasta: string) {
  return Math.round((toUTC(hasta) - toUTC(desde)) / 86400000);
}

export function sumarMes(fecha: string, meses = 1) {
  const [y, m, d] = fecha.split("-").map(Number);
  const ultimo = new Date(Date.UTC(y, m - 1 + meses + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m - 1 + meses, Math.min(d, ultimo))).toISOString().slice(0, 10);
}

export function fechaLinda(fecha?: string) {
  if (!fecha) return "";
  const [y, m, d] = fecha.split("-");
  return `${d}/${m}/${y}`;
}

// Al registrar un pago manual: si estaba al día o con poco atraso, sigue el ciclo; si no, arranca hoy.
export function proximoVencimiento(pagadoHasta: string | undefined, hoy = hoyAR()) {
  if (pagadoHasta && diasEntre(pagadoHasta, hoy) <= 15) return sumarMes(pagadoHasta);
  return sumarMes(hoy);
}

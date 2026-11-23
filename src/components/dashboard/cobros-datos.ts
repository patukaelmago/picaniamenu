"use client";

import { useEffect, useState } from "react";
import { useDueno } from "@/components/dashboard/DuenoContext";

export type LocalCobro = {
  id: string;
  nombre: string;
  activo: boolean;
  pendiente: boolean;
  modo: "mp" | "manual" | null;
  autoCorte: boolean;
  suspendido: boolean;
  pagadoHasta: string | null;
  atraso: number | null;
  precio: number;
  debe: number;
  ultimoPago: string | null;
  totalPagado: number;
  cobradoMes: number;
};

export type PagoReciente = { fecha: string; monto: number; medio?: string; local: string; localId: string };

export function estadoLocal(l: LocalCobro): { texto: string; tono: "ok" | "alerta" | "pausa" | "neutro" } {
  if (l.suspendido) return { texto: "Pausada", tono: "pausa" };
  if (l.pendiente) return { texto: "Registro sin pagar", tono: "neutro" };
  if (!l.pagadoHasta) return { texto: "Sin vencimiento", tono: "neutro" };
  if (l.atraso !== null && l.atraso >= 0)
    return { texto: `Atrasado ${l.atraso} día${l.atraso === 1 ? "" : "s"}`, tono: "alerta" };
  return { texto: "Al día", tono: "ok" };
}

export const MEDIOS: Record<string, string> = { mp: "Mercado Pago", efectivo: "Efectivo", transferencia: "Transferencia" };

// Carga el estado de cobro de todos los locales.
export function useCobros() {
  const { api, user } = useDueno();
  const [locales, setLocales] = useState<LocalCobro[] | null>(null);
  const [ultimosPagos, setUltimosPagos] = useState<PagoReciente[]>([]);
  const [error, setError] = useState("");

  async function recargar() {
    try {
      const r = await api<{ locales: LocalCobro[]; ultimosPagos: PagoReciente[] }>("/api/cobros/resumen");
      setLocales(r.locales);
      setUltimosPagos(r.ultimosPagos ?? []);
    } catch {
      setError("No se pudo cargar la información de cobros.");
    }
  }

  useEffect(() => {
    if (user) recargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return { locales, ultimosPagos, error, recargar };
}

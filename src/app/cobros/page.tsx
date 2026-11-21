"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { fechaLinda, pesos } from "@/lib/cobros-shared";

type Local = {
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

function estado(l: Local) {
  if (l.suspendido) return { texto: "Pausada", color: "bg-red-100 text-red-800" };
  if (l.pendiente) return { texto: "Sin pagar (registro)", color: "bg-slate-100 text-slate-700" };
  if (!l.pagadoHasta) return { texto: "Sin vencimiento", color: "bg-slate-100 text-slate-700" };
  if (l.atraso !== null && l.atraso >= 0)
    return { texto: `Atrasado ${l.atraso} día${l.atraso === 1 ? "" : "s"}`, color: "bg-amber-100 text-amber-900" };
  return { texto: "Al día", color: "bg-emerald-100 text-emerald-800" };
}

// Pantalla general de cobros: todos los locales. Solo el superadmin.
export default function CobrosPage() {
  const [locales, setLocales] = useState<Local[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = "/admin/login";
        return;
      }
      try {
        const res = await fetch("/api/cobros/resumen", {
          headers: { Authorization: `Bearer ${await user.getIdToken()}` },
        });
        if (!res.ok) throw new Error(res.status === 403 ? "Solo el administrador de Carta Online ve esta pantalla." : "No se pudo cargar.");
        setLocales((await res.json()).locales);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo cargar.");
      }
    });
    return () => unsub();
  }, []);

  if (error) return <p className="p-8 text-center text-slate-600">{error}</p>;
  if (!locales) return <p className="p-8 text-center text-slate-500 animate-pulse">Cargando cobros…</p>;

  const cobradoMes = locales.reduce((a, l) => a + l.cobradoMes, 0);
  const deuda = locales.reduce((a, l) => a + l.debe, 0);
  const atrasados = locales.filter((l) => l.suspendido || (l.atraso !== null && l.atraso >= 0 && l.pagadoHasta)).length;

  return (
    <main className="min-h-screen bg-[#F5F3EE] px-4 py-8 text-[#171717]">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Cobros</h1>
          <Link href="/select-tenant" className="text-sm font-semibold text-[#1D2E58] underline">
            Volver a restaurantes
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["Cobrado este mes", pesos(cobradoMes)],
            ["Deuda total", pesos(deuda)],
            ["Atrasados o pausados", String(atrasados)],
          ].map(([t, v]) => (
            <div key={t} className="rounded-xl border bg-white p-4">
              <p className="text-sm text-slate-500">{t}</p>
              <p className="mt-1 text-2xl font-bold">{v}</p>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Local</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Vence</th>
                <th className="px-4 py-3 font-medium">Abono</th>
                <th className="px-4 py-3 font-medium">Debe</th>
                <th className="px-4 py-3 font-medium">Último pago</th>
                <th className="px-4 py-3 font-medium">Cobro</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {locales.map((l) => {
                const e = estado(l);
                return (
                  <tr key={l.id}>
                    <td className="px-4 py-3">
                      <Link href={`/admin/${l.id}/cobro`} className="font-semibold text-[#1D2E58] hover:underline">
                        {l.nombre}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${e.color}`}>{e.texto}</span>
                    </td>
                    <td className="px-4 py-3">{l.pagadoHasta ? fechaLinda(l.pagadoHasta) : "—"}</td>
                    <td className="px-4 py-3">{pesos(l.precio)}</td>
                    <td className="px-4 py-3 font-semibold">{l.debe ? pesos(l.debe) : "—"}</td>
                    <td className="px-4 py-3">{l.ultimoPago ? fechaLinda(l.ultimoPago) : "—"}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {l.modo === "mp" ? "Mercado Pago" : l.modo === "manual" ? "Manual" : "—"}
                      {l.autoCorte ? "" : " · sin avisos"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

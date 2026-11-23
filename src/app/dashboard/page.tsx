"use client";

import Link from "next/link";
import { ArrowRight, Home } from "lucide-react";
import { Encabezado, Etiqueta, Kpi, Tarjeta } from "@/components/dashboard/ui";
import { estadoLocal, MEDIOS, useCobros } from "@/components/dashboard/cobros-datos";
import { diasEntre, fechaLinda, hoyAR, pesos } from "@/lib/cobros-shared";

// Resumen general del negocio.
export default function DashboardResumen() {
  const { locales, ultimosPagos, error } = useCobros();

  if (error) return <p className="text-muted-foreground">{error}</p>;
  if (!locales) return <p className="animate-pulse text-muted-foreground">Cargando…</p>;

  const hoy = hoyAR();
  const clientes = locales.filter((l) => l.pagadoHasta);
  const mensual = clientes.filter((l) => !l.suspendido && !l.baja).reduce((a, l) => a + l.precio, 0);
  const cobradoMes = locales.reduce((a, l) => a + l.cobradoMes, 0);
  const deuda = locales.reduce((a, l) => a + l.debe, 0);
  const atrasados = locales.filter((l) => ["alerta", "pausa"].includes(estadoLocal(l).tono));
  const proximos = clientes
    .filter((l) => !l.suspendido && l.pagadoHasta && diasEntre(hoy, l.pagadoHasta) >= 0 && diasEntre(hoy, l.pagadoHasta) <= 15)
    .sort((a, b) => String(a.pagadoHasta).localeCompare(String(b.pagadoHasta)));

  return (
    <>
      <Encabezado icon={Home} titulo="Resumen" bajada="Cómo viene Carta Online hoy." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Clientes" valor={String(clientes.length)} detalle={`${locales.length} locales en total`} />
        <Kpi label="Ingreso mensual esperado" valor={pesos(mensual)} detalle="Suma de abonos de clientes activos" />
        <Kpi label="Cobrado este mes" valor={pesos(cobradoMes)} tono="ok" />
        <Kpi
          label="Deuda"
          valor={pesos(deuda)}
          detalle={`${atrasados.length} atrasado${atrasados.length === 1 ? "" : "s"} o pausado${atrasados.length === 1 ? "" : "s"}`}
          tono={deuda > 0 ? "alerta" : "normal"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Tarjeta>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">Próximos vencimientos</h2>
            <span className="text-xs text-muted-foreground">Próximos 15 días</span>
          </div>
          {proximos.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay vencimientos cerca.</p>
          ) : (
            <ul className="divide-y">
              {proximos.map((l) => {
                const d = diasEntre(hoy, l.pagadoHasta!);
                return (
                  <li key={l.id} className="flex items-center justify-between py-2.5 text-sm">
                    <Link href={`/dashboard/cobros?local=${l.id}`} className="font-medium hover:text-primary">
                      {l.nombre}
                    </Link>
                    <span className="text-muted-foreground">
                      {fechaLinda(l.pagadoHasta!)} · {d === 0 ? "hoy" : `en ${d} día${d === 1 ? "" : "s"}`} · {pesos(l.precio)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Tarjeta>

        <Tarjeta>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">Atrasados y pausados</h2>
            <Link href="/dashboard/cobros" className="flex items-center gap-1 text-xs font-semibold text-primary">
              Ver cobros <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {atrasados.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nadie debe nada. 🎉</p>
          ) : (
            <ul className="divide-y">
              {atrasados.map((l) => {
                const e = estadoLocal(l);
                return (
                  <li key={l.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <Link href={`/dashboard/cobros?local=${l.id}`} className="font-medium hover:text-primary">
                      {l.nombre}
                    </Link>
                    <span className="flex items-center gap-2">
                      <span className="font-semibold">{pesos(l.debe)}</span>
                      <Etiqueta texto={e.texto} tono={e.tono} />
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Tarjeta>

        <Tarjeta className="lg:col-span-2">
          <h2 className="mb-4 font-bold">Últimos pagos</h2>
          {ultimosPagos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no hay pagos registrados.</p>
          ) : (
            <ul className="divide-y">
              {ultimosPagos.map((p, i) => (
                <li key={i} className="flex items-center justify-between py-2.5 text-sm">
                  <span>
                    <span className="font-medium">{p.local}</span>
                    <span className="text-muted-foreground"> · {MEDIOS[p.medio ?? ""] ?? p.medio}</span>
                  </span>
                  <span className="text-muted-foreground">
                    {fechaLinda(p.fecha)} · <span className="font-semibold text-foreground">{pesos(p.monto)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>
      </div>
    </>
  );
}

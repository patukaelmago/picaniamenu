"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Wallet } from "lucide-react";
import { Encabezado, Etiqueta, Kpi, Tarjeta } from "@/components/dashboard/ui";
import { estadoLocal, useCobros } from "@/components/dashboard/cobros-datos";
import CobroPanel from "@/components/admin/CobroPanel";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { fechaLinda, pesos } from "@/lib/cobros-shared";
import { TEMA } from "@/components/dashboard/tema";

const FILTROS = [
  { id: "todos", label: "Todos" },
  { id: "alerta", label: "Atrasados" },
  { id: "pausa", label: "Pausados" },
  { id: "ok", label: "Al día" },
  { id: "neutro", label: "Sin configurar" },
] as const;

// Cobros: estado de cada local y panel para manejarlo.
export default function DashboardCobros() {
  const { locales, error, recargar } = useCobros();
  const [abierto, setAbierto] = useState("");
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]["id"]>("todos");
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    const local = new URLSearchParams(window.location.search).get("local");
    if (local) setAbierto(local);
  }, []);

  function abrir(id: string) {
    setAbierto(id);
    window.history.replaceState(null, "", id ? `/dashboard/cobros?local=${encodeURIComponent(id)}` : "/dashboard/cobros");
  }

  const visibles = useMemo(
    () =>
      (locales ?? []).filter(
        (l) =>
          (filtro === "todos" || estadoLocal(l).tono === filtro) &&
          l.nombre.toLowerCase().includes(busqueda.trim().toLowerCase())
      ),
    [locales, filtro, busqueda]
  );

  if (error) return <p className="text-muted-foreground">{error}</p>;
  if (!locales) return <p className="animate-pulse text-muted-foreground">Cargando cobros…</p>;

  const cobradoMes = locales.reduce((a, l) => a + l.cobradoMes, 0);
  const deuda = locales.reduce((a, l) => a + l.debe, 0);
  const atrasados = locales.filter((l) => ["alerta", "pausa"].includes(estadoLocal(l).tono)).length;

  return (
    <>
      <Encabezado icon={Wallet} titulo="Cobros" bajada="Abonos, vencimientos y pagos de cada local." />

      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Cobrado este mes" valor={pesos(cobradoMes)} tono="ok" />
        <Kpi label="Deuda total" valor={pesos(deuda)} tono={deuda > 0 ? "alerta" : "normal"} />
        <Kpi label="Atrasados o pausados" valor={String(atrasados)} tono={atrasados > 0 ? "alerta" : "normal"} />
      </div>

      <Tarjeta className="p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
          <div className="flex flex-wrap gap-2">
            {FILTROS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFiltro(f.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  filtro === f.id ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-primary/10"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar local"
              className="w-36 bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-semibold">Local</th>
                <th className="px-5 py-3 font-semibold">Estado</th>
                <th className="px-5 py-3 font-semibold">Vence</th>
                <th className="px-5 py-3 font-semibold">Abono</th>
                <th className="px-5 py-3 font-semibold">Debe</th>
                <th className="px-5 py-3 font-semibold">Último pago</th>
                <th className="px-5 py-3 font-semibold">Cobro</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {visibles.map((l) => {
                const e = estadoLocal(l);
                return (
                  <tr key={l.id} onClick={() => abrir(l.id)} className="cursor-pointer transition-colors hover:bg-primary/5">
                    <td className="px-5 py-3.5 font-semibold">{l.nombre}</td>
                    <td className="px-5 py-3.5">
                      <Etiqueta texto={e.texto} tono={e.tono} />
                    </td>
                    <td className="px-5 py-3.5">{l.pagadoHasta ? fechaLinda(l.pagadoHasta) : "—"}</td>
                    <td className="px-5 py-3.5">{pesos(l.precio)}</td>
                    <td className={`px-5 py-3.5 font-semibold ${l.debe ? "text-red-600" : ""}`}>{l.debe ? pesos(l.debe) : "—"}</td>
                    <td className="px-5 py-3.5">{l.ultimoPago ? fechaLinda(l.ultimoPago) : "—"}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {l.modo === "mp" ? "Mercado Pago" : l.modo === "manual" ? "Manual" : "—"}
                      {l.autoCorte ? " · con avisos" : ""}
                    </td>
                  </tr>
                );
              })}
              {visibles.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-muted-foreground">
                    No hay locales con ese filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Tarjeta>

      <Sheet open={!!abierto} onOpenChange={(o) => !o && abrir("")}>
        <SheetContent style={TEMA} className="w-full overflow-y-auto bg-background text-foreground sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle className="text-xl">{locales.find((l) => l.id === abierto)?.nombre ?? abierto}</SheetTitle>
          </SheetHeader>
          {abierto && (
            <div className="mt-4">
              <CobroPanel tenantId={abierto} onCambio={recargar} />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

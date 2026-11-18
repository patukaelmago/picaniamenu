"use client";

import { use, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { Loader2 } from "lucide-react";
import { auth } from "@/lib/firebase";
import { useTenantUI } from "@/hooks/use-tenant-ui";
import { Card, CardContent } from "@/components/ui/card";

type Ranking = { nombre: string; veces: number }[];
type Stats = {
  semana: { visitas: number; personas: number };
  mes: { visitas: number; personas: number };
  porDia: { fecha: string; visitas: number }[];
  platos: Ranking;
  categorias: Ranking;
};

const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const labelDia = (yyyymmdd: string) => {
  const d = new Date(`${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}T12:00:00`);
  return `${DIAS[d.getDay()]} ${d.getDate()}`;
};

export default function TenantStatsPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = use(params);
  const ui = useTenantUI(tenantId);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/estadisticas?tenant=${encodeURIComponent(tenantId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Error");
        setStats(data);
      } catch (e) {
        console.error(e);
        setError("No se pudieron cargar las estadísticas. Probá de nuevo en un rato.");
      }
    });
  }, [tenantId]);

  const cardStyle = {
    backgroundColor: `hsl(${ui.adminCard})`,
    color: `hsl(${ui.adminCardForeground})`,
  };

  const header = (
    <div
      className="rounded-xl border-l-4 px-5 py-5 shadow-sm sm:px-7 sm:py-6"
      style={{
        backgroundColor: `hsl(${ui.adminSidebarBg})`,
        color: `hsl(${ui.adminSidebarText})`,
        borderLeftColor: `hsl(${ui.adminAccent})`,
      }}
    >
      <h1 className="font-headline text-2xl font-bold sm:text-3xl">Estadísticas</h1>
      <p className="mt-1 text-sm opacity-75">Cuántas personas miran tu carta y qué buscan.</p>
    </div>
  );

  if (error) {
    return (
      <div className="space-y-4">
        {header}
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-4">
        {header}
        <div className="flex justify-center p-8">
          <Loader2 className="h-10 w-10 animate-spin" />
        </div>
      </div>
    );
  }

  const tiles = [
    { label: "Visitas, últimos 7 días", value: stats.semana.visitas },
    { label: "Personas, últimos 7 días", value: stats.semana.personas },
    { label: "Visitas, últimos 30 días", value: stats.mes.visitas },
    { label: "Personas, últimos 30 días", value: stats.mes.personas },
  ];
  
  // Analytics solo devuelve los días con visitas: se completan los días sin visitas con 0.
  const visitasPorFecha = new Map(stats.porDia.map((d) => [d.fecha, d.visitas]));
  const ultimos14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const fecha = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
    return { fecha, visitas: visitasPorFecha.get(fecha) ?? 0 };
  });
  const maxDia = Math.max(1, ...ultimos14.map((d) => d.visitas));

  const ranking = (title: string, rows: Ranking, empty: string) => (
    <Card className="border-0 shadow-sm ring-1 ring-black/5" style={cardStyle}>
      <CardContent className="p-4 sm:p-5">
        <p className="mb-3 font-semibold">{title}</p>
        {rows.length === 0 ? (
          <p className="text-sm opacity-70">{empty}</p>
        ) : (
          <ol className="space-y-2">
            {rows.map((row, i) => (
              <li key={row.nombre} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 break-words">
                  <span className="mr-2 opacity-50">{i + 1}.</span>
                  {row.nombre}
                </span>
                <span className="shrink-0 font-semibold tabular-nums">{row.veces}</span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div
      className="min-h-screen w-full space-y-4 p-0 sm:space-y-6 sm:p-2"
      style={{ backgroundColor: `hsl(${ui.adminBackground})` }}
    >
      {header}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <Card key={t.label} className="border-0 shadow-sm ring-1 ring-black/5" style={cardStyle}>
            <CardContent className="p-4">
              <p className="text-3xl font-bold tabular-nums">{t.value}</p>
              <p className="text-sm opacity-70">{t.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0 shadow-sm ring-1 ring-black/5" style={cardStyle}>
        <CardContent className="p-4 sm:p-5">
          <p className="mb-4 font-semibold">Visitas por día (últimas 2 semanas)</p>
          {ultimos14.every((d) => d.visitas === 0) ? (
            <p className="text-sm opacity-70">Todavía no hay visitas registradas.</p>
          ) : (
            <div className="flex h-40 items-end gap-1">
              {ultimos14.map((d) => (
                <div key={d.fecha} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
                  <span className="text-[10px] tabular-nums opacity-70">{d.visitas}</span>
                  <div
                    className="w-full rounded-t"
                    style={{
                      height: `${(d.visitas / maxDia) * 100}%`,
                      minHeight: d.visitas > 0 ? 2 : 0,
                      backgroundColor: `hsl(${ui.adminAccent})`,
                    }}
                    title={`${labelDia(d.fecha)}: ${d.visitas} visitas`}
                  />
                  <span className="w-full truncate text-center text-[10px] opacity-70">
                    {labelDia(d.fecha)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {ranking(
          "Platos más vistos (30 días)",
          stats.platos,
          "Se cuenta cuando alguien toca la foto de un plato. Todavía no hay datos."
        )}
        {ranking(
          "Categorías más elegidas (30 días)",
          stats.categorias,
          "Se cuenta cuando alguien elige una categoría en el menú. Todavía no hay datos."
        )}
      </div>

      <p className="text-xs opacity-60">Los datos pueden tardar hasta un día en aparecer.</p>
    </div>
  );
}

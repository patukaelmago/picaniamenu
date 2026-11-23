import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

// Piezas visuales comunes del panel del dueño.
export function Encabezado({ icon: Icon, titulo, bajada, accion }: { icon: LucideIcon; titulo: string; bajada?: string; accion?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </span>
        <h1 className="text-2xl font-bold text-foreground">{titulo}</h1>
        {bajada && <p className="mt-1 text-sm text-muted-foreground">{bajada}</p>}
      </div>
      {accion}
    </div>
  );
}

export function Tarjeta({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border bg-card p-5 text-card-foreground shadow-sm ${className}`}>{children}</div>;
}

export function Kpi({ label, valor, detalle, tono = "normal" }: { label: string; valor: string; detalle?: string; tono?: "normal" | "alerta" | "ok" }) {
  const color = tono === "alerta" ? "text-red-600" : tono === "ok" ? "text-emerald-700" : "text-foreground";
  return (
    <Tarjeta>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`mt-1 text-3xl font-bold tracking-tight ${color}`}>{valor}</p>
      {detalle && <p className="mt-1 text-xs text-muted-foreground">{detalle}</p>}
    </Tarjeta>
  );
}

export function Etiqueta({ texto, tono }: { texto: string; tono: "ok" | "alerta" | "pausa" | "neutro" }) {
  const c = {
    ok: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    alerta: "bg-amber-50 text-amber-800 ring-amber-200",
    pausa: "bg-red-50 text-red-700 ring-red-200",
    neutro: "bg-slate-50 text-slate-600 ring-slate-200",
  }[tono];
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${c}`}>{texto}</span>;
}

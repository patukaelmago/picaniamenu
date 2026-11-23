"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fechaLinda, pesos } from "@/lib/cobros-shared";

type Abono = {
  nombre: string;
  precio: number;
  pagadoHasta: string | null;
  modo: "mp" | "manual" | null;
  suspendido: boolean;
  activo: boolean;
  debito: string | null;
  baja: { tipo: string; efectivaEl: string; pendiente?: boolean } | null;
  puedeArrepentirse: boolean;
  pagos: { fecha: string; desde: string; hasta: string; monto: number; medio: string }[];
};

const MEDIOS: Record<string, string> = { mp: "Mercado Pago", efectivo: "Efectivo", transferencia: "Transferencia" };

// Mi abono: estado del abono, débito automático y baja. Lo ve el dueño de cada local.
export default function AbonoPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = use(params);
  const [user, setUser] = useState<User | null>(null);
  const [abono, setAbono] = useState<Abono | null>(null);
  const [error, setError] = useState("");
  const [mpEmail, setMpEmail] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [confirmarBaja, setConfirmarBaja] = useState<"" | "baja" | "arrepentimiento">("");
  const [aviso, setAviso] = useState("");

  async function api(method: "GET" | "POST", body?: unknown) {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(`/api/abono/${tenantId}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "No se pudo completar.");
    return data;
  }

  async function cargar() {
    try {
      setAbono(await api("GET"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar.");
    }
  }

  useEffect(
    () =>
      onAuthStateChanged(auth, async (u) => {
        setUser(u);
        if (!u) return;
        setMpEmail((v) => v || (u.email ?? ""));
        // Al volver de Mercado Pago, se verifica si quedó autorizado.
        if (new URLSearchParams(window.location.search).get("mp") === "1") {
          await api("POST", { accion: "verificar" }).catch(() => null);
          window.history.replaceState(null, "", `/admin/${tenantId}/abono`);
        }
        await cargar();
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tenantId]
  );

  async function activar() {
    setOcupado(true);
    setAviso("");
    try {
      const r = await api("POST", { accion: "activar", mpEmail });
      if (r.pagoUrl) window.location.href = r.pagoUrl;
    } catch (e) {
      setAviso(e instanceof Error ? e.message : "No se pudo iniciar.");
      setOcupado(false);
    }
  }

  async function darDeBaja(tipo: "baja" | "arrepentimiento") {
    setOcupado(true);
    try {
      const r = await api("POST", { accion: tipo });
      setAviso(
        r.ok
          ? `${tipo === "baja" ? "Baja" : "Arrepentimiento"} confirmado. Código ${r.codigo}. Te mandamos el detalle por mail.`
          : r.error
      );
      setConfirmarBaja("");
      await cargar();
    } catch (e) {
      setAviso(e instanceof Error ? e.message : "No se pudo completar.");
    } finally {
      setOcupado(false);
    }
  }

  if (error) return <p className="text-muted-foreground">{error}</p>;
  if (!abono || !user) return <p className="animate-pulse text-muted-foreground">Cargando…</p>;

  const debitoActivo = abono.debito === "activo" && !abono.baja;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mi abono</CardTitle>
          <CardDescription>Carta Online · {abono.nombre}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Dato label="Abono mensual" valor={pesos(abono.precio)} />
          <Dato label="Próximo vencimiento" valor={abono.pagadoHasta ? fechaLinda(abono.pagadoHasta) : "—"} />
          <Dato
            label="Estado"
            valor={
              abono.baja
                ? abono.baja.pendiente
                  ? `De baja desde el ${fechaLinda(abono.baja.efectivaEl)}`
                  : "Dado de baja"
                : abono.suspendido
                  ? "Pausado por falta de pago"
                  : "Activo"
            }
          />
        </CardContent>
      </Card>

      {aviso && <p className="rounded-lg border bg-card p-4 text-sm font-medium">{aviso}</p>}

      {!abono.baja && (
        <Card>
          <CardHeader>
            <CardTitle>Débito automático</CardTitle>
            <CardDescription>
              {debitoActivo
                ? `Activo: Mercado Pago debita ${pesos(abono.precio)} todos los meses. No tenés que hacer nada.`
                : `Pagá el abono solo, todos los meses, con tu tarjeta o el dinero de tu cuenta de Mercado Pago.${
                    abono.pagadoHasta ? ` El primer débito sale el ${fechaLinda(abono.pagadoHasta)}.` : ""
                  }`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mp">Email de tu cuenta de Mercado Pago</Label>
              <Input id="mp" type="email" value={mpEmail} onChange={(e) => setMpEmail(e.target.value)} />
            </div>
            <Button onClick={activar} disabled={ocupado || !mpEmail}>
              {debitoActivo ? "Cambiar tarjeta o cuenta" : "Activar débito automático"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Te llevamos a Mercado Pago para que elijas cómo pagar y lo autorices. Podés darlo de baja cuando quieras
              desde acá abajo. Al activarlo aceptás los{" "}
              <Link href="/terminos" target="_blank" className="underline">
                términos y condiciones
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Pagos</CardTitle>
        </CardHeader>
        <CardContent>
          {abono.pagos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no hay pagos registrados.</p>
          ) : (
            <ul className="divide-y text-sm">
              {abono.pagos.map((p, i) => (
                <li key={i} className="flex flex-wrap justify-between gap-2 py-2.5">
                  <span>
                    {fechaLinda(p.desde)} al {fechaLinda(p.hasta)}
                    <span className="text-muted-foreground"> · {MEDIOS[p.medio] ?? p.medio}</span>
                  </span>
                  <span className="font-semibold">{pesos(p.monto)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {!abono.baja && (
        <Card>
          <CardHeader>
            <CardTitle>Dar de baja</CardTitle>
            <CardDescription>
              Se cancela el débito y no se te vuelve a cobrar. La carta sigue visible hasta el fin del período que ya
              pagaste.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {confirmarBaja ? (
              <div className="space-y-3 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900">
                <p>
                  {confirmarBaja === "baja"
                    ? "¿Seguro que querés dar de baja Carta Online?"
                    : "¿Seguro que querés arrepentirte? Se corta hoy y te devolvemos lo que pagaste."}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="destructive" disabled={ocupado} onClick={() => darDeBaja(confirmarBaja)}>
                    Sí, confirmar
                  </Button>
                  <Button variant="outline" className="bg-transparent" onClick={() => setConfirmarBaja("")}>
                    No, volver
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button variant="destructive" onClick={() => setConfirmarBaja("baja")}>
                  Dar de baja el servicio
                </Button>
                {abono.puedeArrepentirse && (
                  <Button variant="outline" className="bg-transparent" onClick={() => setConfirmarBaja("arrepentimiento")}>
                    Me arrepiento (10 días)
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Dato({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{valor}</p>
    </div>
  );
}

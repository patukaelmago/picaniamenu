"use client";

import { use, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  DIA_CORTE,
  DIAS_AVISO,
  diasEntre,
  fechaLinda,
  hoyAR,
  proximoVencimiento,
  type Cobro,
  type CobroModo,
} from "@/lib/cobros-shared";

type Pago = {
  id: string;
  fecha: string;
  desde: string;
  hasta: string;
  monto: number;
  medio: string;
  nota?: string;
};
type Evento = { id: string; tipo: string; detalle: string; creadoEn: string | null };
type Historial = { clienteDesde: string | null; pagos: Pago[]; eventos: Evento[] };

const MEDIOS: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  mp: "Mercado Pago",
};

// Cobro del local: solo lo ve y lo usa el superadmin.
export default function CobroPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = use(params);
  const [permitido, setPermitido] = useState<boolean | null>(null);
  const [ownerEmail, setOwnerEmail] = useState("");
  const [active, setActive] = useState(true);
  const [cobro, setCobro] = useState<Cobro>({});
  const [modo, setModo] = useState<CobroModo>("manual");
  const [autoCorte, setAutoCorte] = useState(false);
  const [pagadoHasta, setPagadoHasta] = useState("");
  const [email, setEmail] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [historial, setHistorial] = useState<Historial | null>(null);
  const [dialogoPago, setDialogoPago] = useState(false);
  const [monto, setMonto] = useState("25000");
  const [medio, setMedio] = useState<"efectivo" | "transferencia" | "mp">("efectivo");
  const [nota, setNota] = useState("");
  const [borrando, setBorrando] = useState("");

  async function api(method: "GET" | "POST", body?: unknown) {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(`/api/cobros/${tenantId}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(String(res.status));
    return res.json();
  }

  async function cargarHistorial() {
    try {
      setHistorial(await api("GET"));
    } catch (e) {
      console.error(e);
    }
  }

  async function accion(body: Record<string, unknown>, mensaje: string) {
    setGuardando(true);
    try {
      await api("POST", body);
      await Promise.all([cargar(), cargarHistorial()]);
      toast({ title: mensaje });
      return true;
    } catch (e) {
      console.error(e);
      toast({ title: "No se pudo completar", variant: "destructive" });
      return false;
    } finally {
      setGuardando(false);
    }
  }

  async function cargar() {
    const snap = await getDoc(doc(db, "tenants", tenantId));
    const data = snap.data() ?? {};
    const c: Cobro = data.cobro ?? {};
    setCobro(c);
    setActive(data.active !== false);
    setOwnerEmail(String(data.ownerEmail ?? ""));
    setModo(c.modo ?? (data.ownerEmail ? "mp" : "manual"));
    setAutoCorte(c.autoCorte === true);
    setPagadoHasta(c.pagadoHasta ?? "");
    setEmail(c.email ?? "");
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user?.email) return setPermitido(false);
      const s = await getDoc(doc(db, "superadmins", user.email.toLowerCase())).catch(() => null);
      const ok = s?.exists() === true && s.data()?.enabled === true;
      setPermitido(ok);
      if (ok) await Promise.all([cargar(), cargarHistorial()]);
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  async function guardar(cambios: Record<string, unknown>, mensaje: string) {
    setGuardando(true);
    try {
      await updateDoc(doc(db, "tenants", tenantId), { ...cambios, updatedAt: serverTimestamp() });
      await cargar();
      toast({ title: mensaje });
    } catch (e) {
      console.error(e);
      toast({ title: "No se pudo guardar", variant: "destructive" });
    } finally {
      setGuardando(false);
    }
  }

  function guardarAjustes() {
    if (autoCorte && !pagadoHasta) {
      toast({ title: "Cargá la fecha de vencimiento para activar los avisos", variant: "destructive" });
      return;
    }
    if (autoCorte && !(email || ownerEmail)) {
      toast({ title: "Cargá el email para los avisos", variant: "destructive" });
      return;
    }
    guardar(
      {
        "cobro.modo": modo,
        "cobro.autoCorte": autoCorte,
        "cobro.pagadoHasta": pagadoHasta,
        "cobro.email": email.trim().toLowerCase(),
      },
      "Cobro guardado"
    );
  }

  async function confirmarPago() {
    // Usa la fecha escrita en el campo, aunque todavía no se haya guardado.
    const base = pagadoHasta || cobro.pagadoHasta || "";
    const nuevo = proximoVencimiento(base || undefined);
    const ok = await accion(
      { accion: "pago", base, monto: Number(monto), medio, nota },
      `Pago registrado. Próximo vencimiento: ${fechaLinda(nuevo)}`
    );
    if (ok) {
      setDialogoPago(false);
      setNota("");
    }
  }

  if (permitido === null) return <p className="text-muted-foreground">Cargando…</p>;
  if (!permitido) return <p className="text-muted-foreground">Solo el administrador de Carta Online ve esta sección.</p>;

  const pagos = historial?.pagos ?? [];
  const total = pagos.reduce((a, p) => a + (Number(p.monto) || 0), 0);
  const hoy = hoyAR();
  const atraso = cobro.pagadoHasta
    ? diasEntre(cobro.pagadoHasta, hoy) - (cobro.modo === "mp" ? 1 : 0)
    : null;
  const estado = cobro.suspendido
    ? "Pausada por falta de pago"
    : !active
      ? "Sin publicar"
      : atraso === null
        ? "Sin vencimiento cargado"
        : atraso < 0
          ? `Al día (vence el ${fechaLinda(cobro.pagadoHasta)})`
          : `Atrasado ${atraso} día${atraso === 1 ? "" : "s"} (venció el ${fechaLinda(cobro.pagadoHasta)})`;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cobro</CardTitle>
          <CardDescription>Estado: {estado}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Tipo de cobro</Label>
            <div className="flex gap-2">
              {(["mp", "manual"] as const).map((m) => (
                <Button
                  key={m}
                  type="button"
                  variant={modo === m ? "default" : "outline"}
                  className={modo === m ? "" : "bg-transparent text-card-foreground"}
                  onClick={() => setModo(m)}
                >
                  {m === "mp" ? "Mercado Pago" : "Manual (efectivo o transferencia)"}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
            <div>
              <p className="font-medium">Avisos y corte automáticos</p>
              <p className="text-sm text-muted-foreground">
                Avisa por mail los días {DIAS_AVISO.join(", ")} desde el vencimiento y pausa la carta el día{" "}
                {DIA_CORTE}.
              </p>
            </div>
            <Switch checked={autoCorte} onCheckedChange={setAutoCorte} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="vence">Vence el</Label>
              <Input id="vence" type="date" value={pagadoHasta} onChange={(e) => setPagadoHasta(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email para avisos</Label>
              <Input
                id="email"
                type="email"
                placeholder={ownerEmail || "dueño@local.com"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <Button onClick={guardarAjustes} disabled={guardando}>
            Guardar
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Acciones</CardTitle>
          <CardDescription>
            "Registrar pago" pasa el vencimiento al mes siguiente y, si estaba pausada, la vuelve a publicar.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button onClick={() => setDialogoPago(true)} disabled={guardando}>
            Registrar pago
          </Button>
          {active ? (
            <Button
              variant="destructive"
              disabled={guardando}
              onClick={() => accion({ accion: "pausar" }, "Carta pausada")}
            >
              Pausar ahora
            </Button>
          ) : (
            <Button
              variant="outline"
              className="bg-transparent text-card-foreground"
              disabled={guardando}
              onClick={() => accion({ accion: "reactivar" }, "Carta reactivada")}
            >
              Reactivar
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial de pagos</CardTitle>
          <CardDescription>
            {pagos.length} cuota{pagos.length === 1 ? "" : "s"} · Total pagado ${total.toLocaleString("es-AR")}
            {historial?.clienteDesde ? ` · Cliente desde ${fechaLinda(historial.clienteDesde)}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pagos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no hay pagos registrados.</p>
          ) : (
            <div className="divide-y">
              {pagos.map((p) => (
                <div key={p.id} className="flex items-start justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium">
                      ${Number(p.monto).toLocaleString("es-AR")} · {MEDIOS[p.medio] ?? p.medio}
                    </p>
                    <p className="text-muted-foreground">
                      Pagó el {fechaLinda(p.fecha)} · Cubre {fechaLinda(p.desde)} al {fechaLinda(p.hasta)}
                    </p>
                    {p.nota && <p className="text-muted-foreground">{p.nota}</p>}
                  </div>
                  <button
                    type="button"
                    title="Borrar del historial"
                    className="shrink-0 rounded p-1 opacity-60 hover:opacity-100"
                    disabled={guardando}
                    onClick={() => {
                      if (borrando === p.id) {
                        setBorrando("");
                        accion({ accion: "borrarPago", pagoId: p.id }, "Pago borrado del historial");
                      } else {
                        setBorrando(p.id);
                      }
                    }}
                  >
                    {borrando === p.id ? (
                      <span className="text-xs font-semibold text-red-600">¿Borrar?</span>
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registro de avisos</CardTitle>
          <CardDescription>Mails enviados, pausas y reactivaciones.</CardDescription>
        </CardHeader>
        <CardContent>
          {(historial?.eventos ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin movimientos todavía.</p>
          ) : (
            <div className="divide-y">
              {historial!.eventos.map((ev) => (
                <div key={ev.id} className="py-2 text-sm">
                  <span className="text-muted-foreground">
                    {ev.creadoEn ? new Date(ev.creadoEn).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" }) : ""}
                  </span>{" "}
                  {ev.detalle}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogoPago} onOpenChange={setDialogoPago}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar pago</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Próximo vencimiento: {fechaLinda(proximoVencimiento((pagadoHasta || cobro.pagadoHasta) || undefined))}
            </p>
            <div className="space-y-2">
              <Label htmlFor="monto">Monto</Label>
              <Input id="monto" inputMode="numeric" value={monto} onChange={(e) => setMonto(e.target.value.replace(/\D/g, ""))} />
            </div>
            <div className="space-y-2">
              <Label>Medio</Label>
              <div className="flex flex-wrap gap-2">
                {(["efectivo", "transferencia", "mp"] as const).map((m) => (
                  <Button
                    key={m}
                    type="button"
                    variant={medio === m ? "default" : "outline"}
                    className={medio === m ? "" : "bg-transparent"}
                    onClick={() => setMedio(m)}
                  >
                    {MEDIOS[m]}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nota">Nota (opcional)</Label>
              <Input id="nota" value={nota} onChange={(e) => setNota(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={confirmarPago} disabled={guardando || !Number(monto)}>
              Confirmar pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

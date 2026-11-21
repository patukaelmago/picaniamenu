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
      if (ok) await cargar();
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

  function registrarPago() {
    const nuevo = proximoVencimiento(cobro.pagadoHasta || pagadoHasta || undefined);
    guardar(
      {
        "cobro.pagadoHasta": nuevo,
        "cobro.suspendido": false,
        active: true,
        pending: false,
      },
      `Pago registrado. Próximo vencimiento: ${fechaLinda(nuevo)}`
    );
  }

  if (permitido === null) return <p className="text-muted-foreground">Cargando…</p>;
  if (!permitido) return <p className="text-muted-foreground">Solo el administrador de Carta Online ve esta sección.</p>;

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
          <Button onClick={registrarPago} disabled={guardando}>
            Registrar pago
          </Button>
          {active ? (
            <Button
              variant="destructive"
              disabled={guardando}
              onClick={() => guardar({ active: false, "cobro.suspendido": true }, "Carta pausada")}
            >
              Pausar ahora
            </Button>
          ) : (
            <Button
              variant="outline"
              disabled={guardando}
              onClick={() =>
                guardar({ active: true, pending: false, "cobro.suspendido": false }, "Carta reactivada")
              }
            >
              Reactivar
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

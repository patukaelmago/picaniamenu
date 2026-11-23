"use client";

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import AdminSidebar from "@/components/admin-sidebar";
import { usePathname } from "next/navigation";
import { Toaster } from "@/components/ui/toaster";
import AdminAuthGuard from "@/components/AdminAuthGuard";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { diasEntre, hoyAR } from "@/lib/cobros-shared";

const SECTION_LABELS: Record<string, string> = {
  inicio: "Inicio",
  almuerzo: "Almuerzo Ejecutivo",
  menu: "Menú",
  qr: "QR",
  estadisticas: "Estadísticas",
  colors: "Colores",
  settings: "Ajustes",
  abono: "Mi abono",

};

// "/admin/ladepto/menu" -> "Menú"
const sectionFromPath = (pathname: string) => {
  const parts = (pathname || "").split("/").filter(Boolean);
  return SECTION_LABELS[parts[2] ?? ""] ?? "";
};

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [tenantName, setTenantName] = useState("");
  const [pendingTenant, setPendingTenant] = useState(false);
  const [aviso, setAviso] = useState<"" | "pausada" | "atrasada">("");
  const [pagoMp, setPagoMp] = useState(false);

  const parts = (pathname || "").split("/").filter(Boolean);
  const tenantId =
    parts[0] === "admin" && parts[1] && !["login", "tenants", "import", "menu", "qr", "settings"].includes(parts[1])
      ? parts[1]
      : "";

  useEffect(() => {
    if (!tenantId) {
      setPendingTenant(false);
      return;
    }
    getDoc(doc(db, "tenants", tenantId))
      .then((snap) => {
        const data = snap.data();
        const cobro = data?.cobro ?? {};
        const atraso = cobro.pagadoHasta
          ? diasEntre(cobro.pagadoHasta, hoyAR()) - (cobro.modo === "mp" ? 1 : 0)
          : -1;
        setPagoMp(cobro.modo !== "manual");
        setAviso(cobro.suspendido ? "pausada" : cobro.autoCorte && atraso >= 0 ? "atrasada" : "");
        setPendingTenant(snap.exists() && data?.active === false && !cobro.suspendido);
      })
      .catch(() => setPendingTenant(false));
  }, [tenantId]);

  if (pathname === "/admin/login") {
    return <div className="min-h-screen bg-secondary">{children}</div>;
  }

  return (
    <AdminAuthGuard>
      <SidebarProvider>
        <AdminSidebar onTenantName={setTenantName} />
        <SidebarInset
          className="min-w-0 overflow-x-hidden"
          style={{ backgroundColor: "hsl(var(--background))" }}
        >
          <div className="sticky top-0 z-40 flex items-center gap-3 bg-background/80 px-4 py-3 backdrop-blur md:hidden">
            <SidebarTrigger className="h-9 w-9 shrink-0" />
            <p className="min-w-0 truncate text-sm">
              {tenantName && <span className="font-semibold">{tenantName}</span>}
              {tenantName && sectionFromPath(pathname) && <span className="opacity-60"> · </span>}
              <span className="opacity-80">{sectionFromPath(pathname)}</span>
            </p>
          </div>
          {pendingTenant && (
            <div className="mx-3 mt-3 rounded-lg border border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:mx-6 lg:mx-8">
              <strong>Tu carta todavía no está publicada.</strong> Podés armarla mientras tanto; se
              publica cuando se acredita el abono.{" "}
              <a href="/registro?pagar=1" className="font-semibold underline">
                Pagar con Mercado Pago
              </a>
            </div>
          )}
          {aviso && (
            <div className="mx-3 mt-3 rounded-lg border border-red-400 bg-red-50 px-4 py-3 text-sm text-red-900 sm:mx-6 lg:mx-8">
              <strong>
                {aviso === "pausada"
                  ? "Tu carta está pausada por falta de pago."
                  : "Tenés el abono pendiente de pago."}
              </strong>{" "}
              {aviso === "pausada"
                ? "No se borró nada: vuelve a verse cuando se registre el pago."
                : "Si no se paga, la carta se pausa."}{" "}
              {pagoMp ? (
                <a href={`/admin/${tenantId}/abono`} className="font-semibold underline">
                  Pagar con Mercado Pago
                </a>
              ) : (
                <a href="https://wa.me/5493417510112" className="font-semibold underline">
                  Escribinos por WhatsApp
                </a>
              )}
            </div>
          )}
          <div className="min-w-0 p-3 sm:p-6 lg:p-8">{children}</div>
        </SidebarInset>
        <Toaster />
      </SidebarProvider>
    </AdminAuthGuard>
  );
}

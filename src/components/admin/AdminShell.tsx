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

const SECTION_LABELS: Record<string, string> = {
  inicio: "Inicio",
  almuerzo: "Almuerzo Ejecutivo",
  menu: "Menú",
  qr: "QR",
  estadisticas: "Estadísticas",
  colors: "Colores",
  settings: "Ajustes",
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
      .then((snap) => setPendingTenant(snap.exists() && snap.data()?.active === false))
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
              <strong>Tu carta está en revisión.</strong> Podés armarla mientras tanto; tus clientes la
              van a ver por el QR cuando la aprobemos.
            </div>
          )}
          <div className="min-w-0 p-3 sm:p-6 lg:p-8">{children}</div>
        </SidebarInset>
        <Toaster />
      </SidebarProvider>
    </AdminAuthGuard>
  );
}

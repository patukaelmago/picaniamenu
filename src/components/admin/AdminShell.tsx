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
import { useState } from "react";

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
          <div className="min-w-0 p-3 sm:p-6 lg:p-8">{children}</div>
        </SidebarInset>
        <Toaster />
      </SidebarProvider>
    </AdminAuthGuard>
  );
}

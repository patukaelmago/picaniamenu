"use client";
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import AdminSidebar from "@/components/admin-sidebar";
import { usePathname } from "next/navigation";
import { Toaster } from "@/components/ui/toaster";
import AdminAuthGuard from "@/components/AdminAuthGuard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Si estamos en la página de login, no envolvemos con el guard
  if (pathname === "/admin/login") {
    return <div className="bg-secondary min-h-screen">{children}</div>;
  }

  // Para todas las demás rutas del admin, aplicamos el guard
  return (
    <AdminAuthGuard>
      <SidebarProvider>
        <AdminSidebar />
        <SidebarInset>
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </SidebarInset>
        <Toaster />
      </SidebarProvider>
    </AdminAuthGuard>
  );
}

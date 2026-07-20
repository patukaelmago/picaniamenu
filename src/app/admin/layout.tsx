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

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return <div className="bg-secondary min-h-screen">{children}</div>;
  }

  return (
    <AdminAuthGuard>
      <SidebarProvider>
        <AdminSidebar />

        <SidebarInset
          style={{
            backgroundColor: "hsl(var(--background))",
          }}
        >
          <div className="sticky top-0 z-40 flex items-center bg-background/80 px-4 py-3 backdrop-blur md:hidden">
            <SidebarTrigger className="h-9 w-9" />
          </div>

          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </SidebarInset>

        <Toaster />
      </SidebarProvider>
    </AdminAuthGuard>
  );
}
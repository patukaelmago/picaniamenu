import { Home, Wallet, Store, PlusCircle, type LucideIcon } from "lucide-react";

// Secciones del panel del dueño. Para sumar una nueva: crear la página en
// src/app/dashboard/<ruta>/page.tsx y agregarla acá.
export type Seccion = { href: string; label: string; icon: LucideIcon; externa?: boolean };

export const SECCIONES: Seccion[] = [
  { href: "/dashboard", label: "Resumen", icon: Home },
  { href: "/dashboard/cobros", label: "Cobros", icon: Wallet },
  { href: "/select-tenant", label: "Restaurantes", icon: Store, externa: true },
  { href: "/admin/tenants/new", label: "Crear tenant", icon: PlusCircle, externa: true },
];

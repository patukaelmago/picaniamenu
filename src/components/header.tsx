"use client";

import { Utensils } from "lucide-react";
import Link from "next/link";
import { useRestaurantSettings } from "@/hooks/use-restaurant-settings";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Header() {
  const settings = useRestaurantSettings();

  return (
    <header className="sticky top-0 z-40 border-b bg-[hsl(var(--nav-bg))] text-[hsl(var(--nav-text))]">
      <div className="relative container mx-auto flex h-20 items-center px-4 md:px-6">
        {/* LOGO CENTRADO */}
        <Link
          href="/"
          className="
            absolute left-1/2 -translate-x-1/2
            flex items-center gap-3
            opacity-90
            transition-transform transition-opacity
            hover:opacity-100 hover:scale-105
          "
        >
          {/* Usamos rutas relativas a la raíz para evitar 404 en subrutas */}
          <img
            src="/logorecortado.png"
            alt="Logo"
            className="h-12 w-auto object-contain dark:hidden"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />

          <img
            src="/logorecortado_azul.png"
            alt="Logo Dark"
            className="hidden h-12 w-auto object-contain dark:block"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          
          {/* Fallback si no hay imágenes o fallan */}
          <span className="font-headline font-bold text-xl tracking-widest uppercase hidden [img:hidden~&]:block">
            {settings?.name || "Menú"}
          </span>
        </Link>

        {/* DERECHA: TOGGLE DE TEMA */}
        <nav className="ml-auto flex items-center">
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

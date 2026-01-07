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
          href="https://picania-rosario.github.io/picania.github.io/"
          className="
            absolute left-1/2 -translate-x-1/2
            flex items-center gap-3
            opacity-90
            transition-transform transition-opacity
            hover:opacity-100 hover:scale-105
            dark:brightness-75
  dark:hover:brightness-100
          "
        >
          {settings?.logoUrl ? (
            <>
              {/* LOGO MODO CLARO */}
              <img
                src="/logorecortado.png"
                alt="Logo"
                className="h-12 w-auto object-contain dark:hidden"
              />

              {/* LOGO MODO OSCURO (AZUL) */}
              <img
                src="/logorecortado_azul.png"
                alt="Logo"
                className="hidden h-12 w-auto object-contain dark:block"
              />
            </>
          ) : (
            <Utensils className="h-8 w-8 text-[hsl(var(--nav-text))]" />
          )}
        </Link>

        {/* DERECHA: TOGGLE DE TEMA */}
        <nav className="ml-auto flex items-center">
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

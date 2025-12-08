"use client";

import { Utensils } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRestaurantSettings } from "@/hooks/use-restaurant-settings";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Header() {
  const settings = useRestaurantSettings();

  return (
    <header className="sticky top-0 z-40 border-b bg-[hsl(var(--nav-bg))] text-[hsl(var(--nav-text))]">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">

        {/* LOGO + NOMBRE */}
        <Link
          href="https://picania-rosario.github.io/picania.github.io/"
          className="flex items-center gap-3"
        >
          {settings?.logoUrl ? (
            <img
              src="/logorecortado.png"
              alt="Logo"
              className="h-8 w-auto object-contain mt-1"
            />
          ) : (
            <Utensils className="h-8 w-8 text-[hsl(var(--nav-text))]" />
          )}
        </Link>

        {/* NAVEGACIÓN */}
        <nav className="flex items-center gap-4">

          {/* BOTÓN Menu Viernes */}
          <Button
            variant="ghost"
            asChild
            className="
              text-[hsl(var(--nav-text))]
              hover:text-[hsl(var(--nav-accent))]
              hover:bg-transparent
              transition-colors
            "
          >
            <Link href="/menu#menu-viernes">Almuerzo Viernes</Link>
          </Button>

          {/* TOGGLE DE TEMA (claro/oscuro) */}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

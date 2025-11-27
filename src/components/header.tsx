"use client";

import { Utensils } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRestaurantSettings } from "@/hooks/use-restaurant-settings";

export default function Header() {
  const settings = useRestaurantSettings();

  return (
    <header className="sticky top-0 z-40 border-b bg-[hsl(var(--nav-bg))] text-[hsl(var(--nav-text))]">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">
        
        {/* LOGO + NOMBRE */}
        <Link href="/" className="flex items-center gap-3">
          {settings?.logoUrl ? (
            <img
              src="/logorecortado.png"
              alt="Logo"
              className="h-8 w-auto object-contain mt-1"
            />
          ) : (
            <Utensils className="h-8 w-8 text-[hsl(var(--nav-text))]" />
          )}
          {/*<span className="text-2xl font-headline font-bold text-[hsl(var(--nav-text))]">
            {settings?.name ?? "Picaña"}
          </span>*/}
        </Link>

        {/* NAVEGACIÓN */}
        <nav className="flex items-center gap-4">
          
          {/* BOTÓN MENÚ 
          <Button
            variant="ghost"
            asChild
            className="
              text-[hsl(var(--nav-text))] 
              hover:bg-[hsl(var(--nav-text))] 
              hover:text-[hsl(var(--nav-bg))]
              transition-colors
            "
          >
            <Link href="/menu">Menú</Link>
          </Button> */}

          {/* BOTÓN CÓDIGO QR */}
          <Button
            variant="ghost"
            asChild
            className="
              text-[hsl(var(--nav-text))] 
              hover:bg-[hsl(var(--nav-text))] 
              hover:text-[hsl(var(--nav-bg))]
              transition-colors
            "
          >
            <Link href="/qr">Código QR</Link>
          </Button>

          {/* BOTÓN ADMIN: SE MANTIENE IGUAL */}
          <Button
            variant="ghost"
            asChild
            className="
              text-[hsl(var(--nav-text))]
              hover:bg-[hsl(var(--nav-text))]
              hover:text-[hsl(var(--nav-bg))]
              transition-colors
            "
          >
            <Link href="/admin">Admin</Link>
          </Button>

        </nav>
      </div>
    </header>
  );
}

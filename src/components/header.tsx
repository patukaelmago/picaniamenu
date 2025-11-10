"use client";

import { Utensils } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRestaurantSettings } from "@/hooks/use-restaurant-settings";

export default function Header() {
  const settings = useRestaurantSettings();

  return (
    <header className="bg-background/80 backdrop-blur-sm sticky top-0 z-40 border-b">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">
        {/* --------- IZQUIERDA: Logo + Nombre --------- */}
        <Link href="/" className="flex items-center gap-3">
          {settings?.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt="Logo"
              className="h-10 w-auto object-contain"
            />
          ) : (
            <Utensils className="h-8 w-8 text-accent" />
          )}
          <span className="text-2xl font-headline font-bold text-foreground">
            {settings?.name ?? "Picaña"}
          </span>
        </Link>

        {/* --------- DERECHA: Navegación --------- */}
        <nav className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/menu">Menú</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/qr">Código QR</Link>
          </Button>
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/admin">Admin</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

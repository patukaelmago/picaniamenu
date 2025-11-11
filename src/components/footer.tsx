"use client";

import { Utensils, Twitter, Instagram, Facebook } from 'lucide-react';
import Link from 'next/link';
import { useRestaurantSettings } from "@/hooks/use-restaurant-settings";




export default function Footer() {
  const settings  = useRestaurantSettings();
  const restaurantName = settings?.name || "Picaña";
  return (
    <footer className="bg-secondary text-secondary-foreground border-t">
      <div className="container mx-auto flex flex-col items-center justify-between gap-6 px-4 py-8 md:flex-row md:px-6">
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
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} {restaurantName} Restaurante. Todos los derechos reservados.
        </p>
        <div className="flex items-center gap-4">
          <Link href="#" aria-label="Twitter">
            <Twitter className="h-5 w-5 hover:text-accent transition-colors" />
          </Link>
          <Link href="#" aria-label="Instagram">
            <Instagram className="h-5 w-5 hover:text-accent transition-colors" />
          </Link>
          <Link href="#" aria-label="Facebook">
            <Facebook className="h-5 w-5 hover:text-accent transition-colors" />
          </Link>
        </div>
      </div>
    </footer>
  );
}

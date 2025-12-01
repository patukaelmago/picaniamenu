"use client";

import { Utensils, Twitter, Instagram, Facebook } from "lucide-react";
import Link from "next/link";
import { useRestaurantSettings } from "@/hooks/use-restaurant-settings";

export default function Footer() {
  const settings = useRestaurantSettings();
  const restaurantName = settings?.name || "Picaña";

  return (
    <footer className="border-t bg-[hsl(var(--nav-bg))] text-[hsl(var(--nav-text))]">
      <div className="container mx-auto flex flex-col items-center justify-between gap-6 px-4 py-8 md:px-6">

        {/* LOGO + NOMBRE */}
        <Link href="/" className="flex items-center mt-2 gap-3">
          {settings?.logoUrl ? (
            <img
              src="/logorecortado.png"
              alt="Logo"
              className="h-8 w-auto object-contain"
            />
          ) : (
            <Utensils className="h-8 w-8 text-[hsl(var(--nav-text))]" />
          )}
          <span className="text-2xl font-headline font-bold text-[hsl(var(--nav-text))]">
           { /*{restaurantName}*/
          }</span>
        </Link>

        {/* COPYRIGHT */}
        <p className="text-sm text-[hsl(var(--nav-text))]/80 mt-4">
          © {new Date().getFullYear()} {restaurantName} Restaurante
        </p>

        {/* REDES SOCIALES 
        <div className="flex items-center gap-4">
          <Link href="#" aria-label="Twitter">
            <Twitter className="h-5 w-5 text-[hsl(var(--nav-text))] hover:text-[#d8b878] transition-colors" />
          </Link>
          <Link href="#" aria-label="Instagram">
            <Instagram className="h-5 w-5 text-[hsl(var(--nav-text))] hover:text-[#d8b878] transition-colors" />
          </Link>
          <Link href="#" aria-label="Facebook">
            <Facebook className="h-5 w-5 text-[hsl(var(--nav-text))] hover:text-[#d8b878] transition-colors" />
          </Link>
        </div>*/}

      </div>
    </footer>
  );
}

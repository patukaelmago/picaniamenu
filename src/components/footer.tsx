"use client";

import { Utensils } from "lucide-react";
import Link from "next/link";
import { useRestaurantSettings } from "@/hooks/use-restaurant-settings";

export default function Footer() {
  const settings = useRestaurantSettings();
  const restaurantName = settings?.name || "Picaña";

  return (
    <footer className="border-t bg-[hsl(var(--nav-bg))] text-[hsl(var(--nav-text))]">
      <div className="container mx-auto flex flex-col items-center gap-6 px-4 py-10">

        {/* LOGO */}
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
        </Link>

        {/* MÉTODOS DE PAGO */}
        <div className="flex items-center gap-6 mt-4 opacity-90">
          <img src="/payments/visa.png" alt="Visa" className="h-6 w-auto" />
          <img src="/payments/mastercard.png" alt="Mastercard" className="h-6 w-auto" />
          <img src="/payments/amex.png" alt="American Express" className="h-6 w-auto" />
          <img src="/payments/mp.png" alt="Mercado Pago" className="h-6 w-auto" />
        </div>

        {/* COPYRIGHT */}
        <p className="text-sm text-[hsl(var(--nav-text))]/80 mt-4">
          © {new Date().getFullYear()} {restaurantName} — Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}

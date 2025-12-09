"use client";

import { Utensils } from "lucide-react";
import Link from "next/link";
import { useRestaurantSettings } from "@/hooks/use-restaurant-settings";

export default function Footer() {
  const settings = useRestaurantSettings();
  const restaurantName = settings?.name || "Picaña";

  return (
    <footer className="border-t bg-[hsl(var(--nav-bg))] text-[hsl(var(--nav-text))]">
      <div className="container mx-auto flex flex-col items-center justify-between gap-6 px-4 py-10 md:px-6">

        {/* LOGO */}
        <Link
          href="https://picania-rosario.github.io/picania.github.io/"
          className="flex items-center gap-3 mt-2"
        >
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

        {/* FORMAS DE PAGO */}
        <div className="flex flex-col items-center gap-3 mt-4">
          <p className="text-sm text-[hsl(var(--nav-text))]/80 tracking-wide">
            Aceptamos las siguientes tarjetas:
          </p>

          <div className="flex items-center gap-6 opacity-90">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png"
              alt="Visa"
              className="h-7 w-auto"
            />

            <img
              src="https://upload.wikimedia.org/wikipedia/commons/0/04/Mastercard-logo.png"
              alt="Mastercard"
              className="h-7 w-auto"
            />

            <img
              src="https://upload.wikimedia.org/wikipedia/commons/3/30/American_Express_logo_%282018%29.svg"
              alt="American Express"
              className="h-7 w-auto"
            />

            <img
              src="https://upload.wikimedia.org/wikipedia/commons/3/30/Mercado_Pago_logo.png"
              alt="Mercado Pago"
              className="h-7 w-auto"
            />
          </div>
        </div>

        {/* COPYRIGHT */}
        <p className="text-sm text-[hsl(var(--nav-text))]/80 mt-4">
          © {new Date().getFullYear()} {restaurantName} Restaurante
        </p>
      </div>
    </footer>
  );
}


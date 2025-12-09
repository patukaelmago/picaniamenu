"use client";

import { Utensils } from "lucide-react";
import Link from "next/link";
import { useRestaurantSettings } from "@/hooks/use-restaurant-settings";

export default function Footer() {
  const settings = useRestaurantSettings();
  const restaurantName = settings?.name || "Picaña";

  return (
    <footer className="border-t bg-[hsl(var(--nav-bg))] text-[hsl(var(--nav-text))]">
      <div className="container mx-auto flex flex-col items-center gap-4 px-4 py-8 md:px-6">

        {/* LOGO */}
        <Link
          href="https://picania-rosario.github.io/picania.github.io/"
          className="
            flex items-center gap-3 mt-2
            opacity-90
            transition-transform transition-opacity
            hover:opacity-100 hover:scale-105
          "
        >
          {settings?.logoUrl ? (
            <img
              src="/logorecortado.png"
              alt="Logo Picaña"
              className="h-8 w-auto object-contain"
            />
          ) : (
            <Utensils className="h-8 w-8 text-[hsl(var(--nav-text))]" />
          )}
        </Link>

        {/* MÉTODOS DE PAGO */}
        <div className="mt-4 flex flex-col items-center gap-3">
          <p className="text-xs tracking-[0.2em] uppercase text-[hsl(var(--nav-text))]/70">
            Aceptamos las siguientes tarjetas
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6">
            <img
              src="/visa.png"
              alt="Visa"
              className="h-6 w-auto opacity-80 grayscale-[40%] transition-all hover:opacity-100 hover:grayscale-0 hover:scale-105"
            />
            <img
              src="/mastercard.png"
              alt="Mastercard"
              className="h-6 w-auto opacity-80 grayscale-[40%] transition-all hover:opacity-100 hover:grayscale-0 hover:scale-105"
            />
            <img
              src="/amex.png"
              alt="American Express"
              className="h-6 w-auto opacity-80 grayscale-[40%] transition-all hover:opacity-100 hover:grayscale-0 hover:scale-105"
            />
            <img
              src="/mp.png"
              alt="Mercado Pago"
              className="h-6 w-auto opacity-80 grayscale-[40%] transition-all hover:opacity-100 hover:grayscale-0 hover:scale-105"
            />
          </div>
        </div>

        {/* COPYRIGHT */}
        <p className="mt-4 text-xs text-[hsl(var(--nav-text))]/70 text-center">
          © {new Date().getFullYear()} {restaurantName} — Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}

"use client";

import { Utensils } from "lucide-react";
import Link from "next/link";
import { useRestaurantSettings } from "@/hooks/use-restaurant-settings";

export default function Footer() {
  const settings = useRestaurantSettings();
  const restaurantName = settings?.name || "Picaña";

  return (
    <footer className="border-t bg-[hsl(var(--nav-bg))] text-[hsl(var(--nav-text))]">
      {/* 👇 Wrapper que iguala el “ancho de contenido” del nav */}
      <div className="mx-auto w-full max-w-6xl px-4 py-4 md:px-6">
        <div className="flex flex-col items-center gap-2">

          {/* LOGO */}
          {/*<Link
            href="https://picania-rosario.github.io/picania.github.io/"
            className="flex items-center gap-3 mt-1 opacity-90 transition-transform transition-opacity hover:opacity-100 hover:scale-105"
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
          </Link>*/}

          {/* MÉTODOS DE PAGO */}
          <div className="flex flex-col items-center gap-0">
            {/*<span className="text-xs tracking-[0.2em] uppercase text-[hsl(var(--nav-text))]/70 mb-1">
              Aceptamos las siguientes tarjetas
            </span>*/}

            {/* ✅ Bloque compacto */}
            <div className="inline-flex items-center gap-x-3">
              <img
                src="/visa.png"
                alt="Visa"
                className="h-6 md:h-7 lg:h-18 w-auto opacity-80 grayscale-[40%] transition-all hover:opacity-100 hover:grayscale-0 hover:scale-105"
              />
              <img
                src="/mastercard.png"
                alt="Mastercard"
                className="h-6 md:h-7 lg:h-14 w-auto opacity-80 grayscale-[40%] transition-all hover:opacity-100 hover:grayscale-0 hover:scale-105"
              />
              <img
                src="/amex.png"
                alt="American Express"
                className="h-6 md:h-7 lg:h-10 w-auto opacity-80 grayscale-[40%] transition-all hover:opacity-100 hover:grayscale-0 hover:scale-105"
              />
              <img
                src="/mp.png"
                alt="Mercado Pago"
                className="h-6 md:h-7 lg:h-8 w-auto opacity-80 grayscale-[40%] transition-all hover:opacity-100 hover:grayscale-0 hover:scale-105"
              />
            </div>
          </div>

          {/* COPYRIGHT */}
          <p className="text-xs text-[hsl(var(--nav-text))]/70 text-center">
            © {new Date().getFullYear()} {restaurantName} — Todos los derechos reservados.
          </p>

        </div>
      </div>
    </footer>
  );
}

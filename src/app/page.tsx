"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <main
      className="
        relative
        min-h-screen
        flex
        flex-col                 /* ← YA NO CENTRA TODO */
        bg-[hsl(var(--nav-bg))]
        text-center
      "
    >

      {/* LOGO PEGADO ARRIBA */}
      <img
        src="https://res.cloudinary.com/dq7nlctcw/image/upload/v1763664071/logo_picania_beige_xfzqk9.png"
        alt="Logo Picaña"
        className="
          z-0
          w-[300px]
          md:w-[420px]
          lg:w-[540px]
          xl:w-[650px]
          h-auto
          mx-auto                  /* centra horizontalmente */
          mt-0                     /* sin margin arriba */
          pt-0                     /* sin padding arriba */
        "
      />

      {/* BLOQUE SUPERPUESTO */}
      <div
        className="
          absolute
          top-[48%]     /* ← ajustado porque el logo ahora está más arriba */
          left-1/2
          -translate-x-1/2
          flex
          flex-col
          items-center
          z-10
        "
      >
        <Button
          asChild
          size="lg"
          className="
            bg-[#fff7e3]
            hover:bg-[#e8dbbd]
            text-[#1b3059]
            font-bold
            text-lg
            py-6
            px-10
            mb-4
          "
        >
          <Link href="/menu">Ver Menú</Link>
        </Button>

        <p className="text-sm md:text-xl font-body text-white whitespace-nowrap mx-auto">
  Donde Carne y Cerveza se Hermanan.
</p>



      </div>
    </main>
  );
}

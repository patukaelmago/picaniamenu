"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <main
      className="
        min-h-screen
        flex
        flex-col
        items-center
        bg-[hsl(var(--nav-bg))]
        text-center
        pt-36        /* Subo todo el bloque un poco más */
        md:pt-20       /* En desktop también sube */
      "
    >

      {/* LOGO */}
      <img
        src="/logorecortado.png"
        alt="Logo Picaña"
        className="
          w-[260px]
          md:w-[360px]      /* +20px extra */
          lg:mt-10     
          h-auto
          mb-20             /* sube el botón */
          opacity-95        /* fade MUY leve */
          pt-24
        "
      />

      {/* BOTÓN */}
      <Button
        asChild
        size="lg"
        className="
          bg-[#fff7e3]
          hover:bg-[#e8dbbd]
          text-[#1b3059]
          font-bold
          text-lg
          mt-24
          md:mt-10
          py-4
          px-8
          mb-4               /* espacio mejorado */
          shadow-sm          /* mejora visual sutil */
        "
       >
        <Link href="/menu">Ver Menú</Link>
      </Button>

      {/* TEXTO */}
      <p className="text-base md:text-xl font-body text-white opacity-95">
       
      </p>

    </main>
  );
}

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
        flex-col
        items-center 
        justify-center 
        text-center 
        p-4
        bg-[hsl(var(--nav-bg))]
        space-y-10
      "
    >

      {/* LOGO SIN POSITION ABSOLUTE */}
      <img
        src="https://res.cloudinary.com/dq7nlctcw/image/upload/v1763664071/logo_picania_beige_xfzqk9.png"
        alt="Logo Picaña"
        className="
          w-[300px]
          md:w-[420px]
          lg:w-[540px]
          xl:w-[650px]
          h-auto
        "
      />

      {/* BOTÓN */}
      <Button
        asChild
        size="lg"
        className="bg-[#fff7e3] hover:bg-[#e8dbbd] text-[#1b3059] font-bold text-lg py-6 px-10"
      >
        <Link href="/menu">Ver Menú</Link>
      </Button>

      {/* TEXTO */}
      <p className="text-xl md:text-2xl font-body max-w-2xl text-white">
        Donde Carne y Cerveza se Hermanan.
      </p>

    </main>
  );
}

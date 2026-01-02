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
        text-center
        pt-36
        md:pt-20
        bg-[hsl(var(--nav-bg))]
        dark:bg-black
      "
    >
      {/* LOGO */}
      <img
        src="/logorecortado.png"
        alt="Logo Picaña"
        className="
          w-[260px]
          md:w-[360px]
          lg:mt-10
          h-auto
          mb-20
          opacity-95
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
          mb-4
          shadow-sm
        "
      >
        <Link href="/menu">Ver Menú</Link>
      </Button>
    </main>
  );
}

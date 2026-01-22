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
        justify-center
        text-center
        p-4
        bg-background
      "
    >
      {/* LOGO */}
      <img
        src="/logorecortado.png"
        alt="Logo Picaña"
        className="
          w-[260px]
          md:w-[360px]
          h-auto
          mb-12
          dark:invert
        "
      />

      {/* BOTÓN */}
      <Button
        asChild
        size="lg"
        className="
          bg-primary
          text-primary-foreground
          hover:bg-primary/90
          dark:bg-accent
          dark:text-accent-foreground
          dark:hover:bg-accent/90
          font-bold
          text-base
          py-4
          px-8
          shadow-sm
        "
      >
        <Link href="/menu">Ver Menú</Link>
      </Button>
    </main>
  );
}

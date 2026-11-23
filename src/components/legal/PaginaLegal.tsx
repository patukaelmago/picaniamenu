import Link from "next/link";
import type { ReactNode } from "react";

// Marco común de las páginas públicas legales (baja, arrepentimiento, términos, privacidad).
export default function PaginaLegal({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#F3F1EC] px-6 py-10 text-[#151A24]">
      <div className="mx-auto max-w-2xl">
        <Link href="/" aria-label="Carta Online">
          <img src="/carta-online-logo-orange.svg" alt="Carta Online" className="h-12 w-auto" />
        </Link>
        <div className="mt-8 rounded-2xl border border-[#DED9CF] bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-black tracking-tight">{titulo}</h1>
          <div className="mt-4 space-y-4 text-[15px] leading-7 text-[#3E4451]">{children}</div>
        </div>
        <LinksLegales className="mt-6 justify-center" />
      </div>
    </main>
  );
}

export function LinksLegales({ className = "" }: { className?: string }) {
  return (
    <nav className={`flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-[#5E6573] ${className}`}>
      <Link href="/baja" className="underline hover:text-[#151A24]">Botón de baja</Link>
      <Link href="/arrepentimiento" className="underline hover:text-[#151A24]">Botón de arrepentimiento</Link>
      <Link href="/terminos" className="underline hover:text-[#151A24]">Términos y condiciones</Link>
      <Link href="/privacidad" className="underline hover:text-[#151A24]">Privacidad</Link>
    </nav>
  );
}

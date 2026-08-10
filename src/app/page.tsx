import Link from "next/link";
import { ArrowRight, Hammer } from "lucide-react";

export default function Home() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#FFFDF7] px-6 text-[#17204A]">
      <div className="absolute -left-24 -top-20 h-72 w-72 rounded-full bg-[#B9FF25]/70 blur-3xl" />
      <div className="absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-[#FF2BA6]/30 blur-3xl" />

      <section className="relative z-10 w-full max-w-3xl text-center">
        <img
          src="/carta-online-logo.png"
          alt="Carta Online"
          className="mx-auto h-20 w-auto object-contain sm:h-24"
        />

        <div className="mx-auto mt-10 flex h-16 w-16 rotate-3 items-center justify-center rounded-2xl border-2 border-[#17204A] bg-[#FF6B00] shadow-[5px_5px_0_#17204A]">
          <Hammer className="h-8 w-8 text-white" />
        </div>

        <p className="mt-8 font-black uppercase tracking-[0.22em] text-[#315BFF]">
          Estamos trabajando
        </p>

        <h1 className="mt-4 text-5xl font-black leading-none tracking-[-0.04em] sm:text-7xl">
          Sitio en construcción
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-[#596080]">
          Estamos preparando una nueva experiencia para Carta Online.
          Muy pronto vas a poder conocerla.
        </p>

        <Link
          href="/menu/maido"
          className="mt-10 inline-flex items-center gap-2 rounded-full border-2 border-[#17204A] bg-[#315BFF] px-6 py-4 font-black text-white shadow-[5px_5px_0_#17204A] transition hover:-translate-y-1"
        >
          Ver menú de demostración
          <ArrowRight className="h-5 w-5" />
        </Link>
      </section>
    </main>
  );
}

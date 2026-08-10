import LoginWithGoogle from "@/components/LoginWithGoogle";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-5 py-4 text-[#F5EEDC]">
      <div className="absolute left-[-180px] top-[-120px] h-[420px] w-[420px] rounded-full bg-[#2563EB]/10 blur-3xl" />
      <div className="absolute bottom-[-180px] right-[-120px] h-[440px] w-[440px] rounded-full bg-[#FF6B00]/10 blur-3xl" />

      <div className="relative w-full max-w-sm">
        <Link
          href="/"
          className="mx-auto mb-4 block w-fit transition-opacity hover:opacity-80"
          aria-label="Carta Online"
        >
          <img
            src="/carta-online-logo-orange.svg"
            alt="Carta Online"
            className="h-16 w-auto object-contain"
          />
        </Link>

        <section className="overflow-hidden rounded-3xl border border-[#3A3A3A] bg-[#202020] shadow-2xl">
          <div className="h-1 bg-gradient-to-r from-[#2563EB] to-[#FF6B00]" />

          <div className="p-6">
            <div className="mb-5 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#FF6B00]/15">
                <ShieldCheck className="h-6 w-6 text-[#FF6B00]" />
              </div>

              <h1 className="mt-3 text-2xl font-bold">Panel de administración</h1>
              <p className="mt-2 text-sm leading-5 text-[#B8B2A7]">
                Iniciá sesión para gestionar tu menú digital.
              </p>
            </div>

            <LoginWithGoogle />

            <p className="mt-4 text-center text-xs leading-4 text-[#8F8A82]">
              Acceso exclusivo para clientes autorizados.
            </p>
          </div>
        </section>

        <Link
          href="/"
          className="mx-auto mt-3 block w-fit text-xs text-[#5E6573] transition hover:text-[#FF6B00]"
        >
          Volver a la página principal
        </Link>
      </div>
    </main>
  );
}

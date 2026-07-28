import LoginWithGoogle from "@/components/LoginWithGoogle";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#171717] px-6 py-12 text-[#F5EEDC]">
      <div className="absolute left-[-180px] top-[-120px] h-[420px] w-[420px] rounded-full bg-[#4B75FF]/15 blur-3xl" />
      <div className="absolute bottom-[-180px] right-[-120px] h-[440px] w-[440px] rounded-full bg-[#FF7A00]/15 blur-3xl" />

      <div className="relative w-full max-w-md">
        <Link
          href="/"
          className="mx-auto mb-7 block w-fit transition-opacity hover:opacity-80"
          aria-label="Carta Online"
        >
          <img
            src="/carta-online-logo.png"
            alt="Carta Online"
            className="h-24 w-auto object-contain"
          />
        </Link>

        <section className="overflow-hidden rounded-3xl border border-[#3A3A3A] bg-[#202020] shadow-2xl">
          <div className="h-1.5 bg-gradient-to-r from-[#4B75FF] to-[#FF7A00]" />

          <div className="p-8 md:p-10">
            <div className="mb-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FF7A00]/15">
                <ShieldCheck className="h-7 w-7 text-[#FF7A00]" />
              </div>

              <h1 className="mt-5 text-3xl font-bold">Panel de administración</h1>
              <p className="mt-3 leading-6 text-[#B8B2A7]">
                Iniciá sesión para gestionar tu menú digital.
              </p>
            </div>

            <LoginWithGoogle />

            <p className="mt-6 text-center text-xs leading-5 text-[#8F8A82]">
              Acceso exclusivo para clientes autorizados.
            </p>
          </div>
        </section>

        <Link
          href="/"
          className="mx-auto mt-6 block w-fit text-sm text-[#B8B2A7] transition hover:text-[#FF7A00]"
        >
          Volver a la página principal
        </Link>
      </div>
    </main>
  );
}

"use client";

import LoginWithGoogle from "@/components/LoginWithGoogle";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#fff7e3]">
      <div className="w-full max-w-md rounded-2xl border border-[#f0e0c0] bg-white/90 shadow-lg p-8 space-y-6">
        <div className="text-center space-y-2">
          <p className="text-[11px] tracking-[0.25em] uppercase text-[#b28a4a]">
            Picaña Admin
          </p>
          <h1 className="text-2xl font-semibold text-[#1b3059]">
            Iniciar sesión
          </h1>
          <p className="text-sm text-slate-500">
            Usá tu cuenta de Google autorizada para administrar el menú del
            restaurante.
          </p>
        </div>

        <LoginWithGoogle />

        <p className="text-[11px] text-center text-slate-400">
          Al continuar aceptás el uso interno del panel de administración de
          Picaña.
        </p>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Toaster } from "@/components/ui/toaster";
import { SECCIONES } from "@/components/dashboard/secciones";
import { DuenoContext } from "@/components/dashboard/DuenoContext";
import { Menu, X } from "lucide-react";
import { TEMA } from "@/components/dashboard/tema";

const DUENO = "patriciouskaer@gmail.com";



export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => onAuthStateChanged(auth, (u) => {
    if (!u) window.location.href = "/admin/login";
    setUser(u);
  }), []);

  useEffect(() => setMenuAbierto(false), [pathname]);

  if (user === undefined) {
    return <div className="flex min-h-screen items-center justify-center bg-[#F8F6F1] text-[#1D2F58]/60">Cargando…</div>;
  }
  if (user?.email?.toLowerCase() !== DUENO) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F6F1] px-6 text-center text-[#1D2F58]">
        No tenés acceso a esta pantalla.
      </div>
    );
  }

  const activa = (href: string) => (href === "/dashboard" ? pathname === href : pathname.startsWith(href));

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {SECCIONES.map((s) => (
        <Link
          key={s.href}
          href={s.href}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
            activa(s.href) ? "bg-[#FF6B1A] text-white shadow-sm" : "text-[#1D2F58] hover:bg-[#FF6B1A]/10"
          }`}
        >
          <s.icon className="h-5 w-5" />
          {s.label}
        </Link>
      ))}
    </nav>
  );

  const pie = (
    <div className="flex items-center gap-3 border-t border-white/10 p-4">
      {user.photoURL ? (
        <img src={user.photoURL} alt="" className="h-9 w-9 rounded-full" />
      ) : (
        <span className="h-9 w-9 rounded-full bg-white/20" />
      )}
      <div className="min-w-0 text-white">
        <p className="truncate text-sm font-semibold">{user.displayName ?? "Patricio"}</p>
        <p className="truncate text-xs text-white/70">{user.email}</p>
      </div>
    </div>
  );

  return (
    <DuenoContext.Provider value={{ user }}>
      <div style={TEMA} className="min-h-screen bg-background text-foreground">
        {/* Barra lateral (escritorio) */}
        <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r bg-white lg:flex">
          <div className="flex h-24 flex-col items-center justify-center bg-[#1D2F58]">
            <img src="/carta-online-logo.png" alt="Carta Online" className="h-10 w-auto" />
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-white/60">Mi panel</p>
          </div>
          {nav}
          <div className="bg-[#1D2F58]">{pie}</div>
        </aside>

        {/* Barra superior (celular) */}
        <header className="sticky top-0 z-30 flex items-center justify-between bg-[#1D2F58] px-4 py-3 lg:hidden">
          <img src="/carta-online-logo.png" alt="Carta Online" className="h-8 w-auto" />
          <button type="button" onClick={() => setMenuAbierto((v) => !v)} className="text-white" aria-label="Menú">
            {menuAbierto ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </header>
        {menuAbierto && (
          <div className="fixed inset-x-0 top-14 z-30 flex flex-col bg-white shadow-lg lg:hidden">
            {nav}
            <div className="bg-[#1D2F58]">{pie}</div>
          </div>
        )}

        <main className="px-4 py-8 sm:px-8 lg:ml-64 lg:px-10">
          <div className="mx-auto w-full max-w-6xl space-y-8">{children}</div>
        </main>
        <Toaster />
      </div>
    </DuenoContext.Provider>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

// Página a la que vuelve el cliente después de pagar en Mercado Pago.
export default function RegistroListoPage() {
  const [local, setLocal] = useState("");
  const [estado, setEstado] = useState<"esperando" | "listo" | "demora">("esperando");

  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("local") ?? "";
    setLocal(slug);
    let intentos = 0;
    let timer = 0;

    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user || !slug) return;
      const consultar = async () => {
        intentos += 1;
        try {
          const token = await user.getIdToken();
          const res = await fetch(`/api/registro/estado?local=${encodeURIComponent(slug)}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (data?.active) {
            setEstado("listo");
            return;
          }
        } catch {
          // se reintenta
        }
        if (intentos >= 24) setEstado("demora");
        else timer = window.setTimeout(consultar, 5000);
      };
      consultar();
    });
    return () => {
      unsub();
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F3F1EC] px-5">
      <section className="w-full max-w-md rounded-3xl bg-[#202020] p-6 text-center text-[#F5EEDC] shadow-2xl">
        {estado === "listo" ? (
          <>
            <h1 className="text-2xl font-bold">¡Listo! Tu carta está publicada</h1>
            <p className="mt-2 text-sm text-[#B8B2A7]">Ya podés cargar tus platos y descargar tu QR.</p>
          </>
        ) : estado === "demora" ? (
          <>
            <h1 className="text-2xl font-bold">Estamos esperando la confirmación</h1>
            <p className="mt-2 text-sm text-[#B8B2A7]">
              Mercado Pago todavía no confirmó el pago. Tu carta se publica sola apenas se acredite.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold">Confirmando tu pago...</h1>
            <p className="mt-2 text-sm text-[#B8B2A7]">Esto puede tardar unos segundos.</p>
          </>
        )}
        {local && (
          <Link
            href={`/admin/${local}/inicio`}
            className="mt-5 inline-block rounded-xl bg-[#FF6B00] px-5 py-3 text-sm font-semibold text-[#171717]"
          >
            Ir a mi panel
          </Link>
        )}
      </section>
    </main>
  );
}

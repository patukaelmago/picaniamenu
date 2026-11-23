"use client";

import { useEffect, useState } from "react";
import PaginaLegal from "@/components/legal/PaginaLegal";

export default function ConfirmarBajaPage() {
  const [estado, setEstado] = useState<"cargando" | "ok" | "error">("cargando");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    fetch("/api/baja/confirmar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codigo: p.get("codigo"), token: p.get("token") }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) throw new Error(d.error);
        setEstado("ok");
        setMensaje(
          `${d.tipo === "arrepentimiento" ? "Arrepentimiento" : "Baja"} confirmada. Código ${d.codigo}. ` +
            "Ya no se te va a debitar el abono y te mandamos el detalle por mail."
        );
      })
      .catch((e) => {
        setEstado("error");
        setMensaje(e instanceof Error && e.message ? e.message : "No se pudo confirmar.");
      });
  }, []);

  return (
    <PaginaLegal titulo="Confirmar solicitud">
      {estado === "cargando" && <p className="animate-pulse">Confirmando…</p>}
      {estado !== "cargando" && (
        <p className={`rounded-xl p-5 font-semibold ${estado === "ok" ? "bg-[#EAF7EE] text-[#14532D]" : "bg-red-50 text-red-700"}`}>
          {mensaje}
        </p>
      )}
    </PaginaLegal>
  );
}

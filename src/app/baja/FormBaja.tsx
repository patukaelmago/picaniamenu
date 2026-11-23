"use client";

import { useEffect, useState } from "react";

// Formulario único para baja y arrepentimiento. No pide iniciar sesión.
export default function FormBaja({ tipoInicial }: { tipoInicial: "baja" | "arrepentimiento" }) {
  const [tipo, setTipo] = useState(tipoInicial);
  const [email, setEmail] = useState("");
  const [local, setLocal] = useState("");
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("email")) setEmail(p.get("email")!);
    if (p.get("local")) setLocal(p.get("local")!);
  }, []);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError("");
    try {
      const res = await fetch("/api/baja", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, email, local, motivo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo enviar.");
      setCodigo(data.codigo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar.");
    } finally {
      setEnviando(false);
    }
  }

  if (codigo) {
    return (
      <div className="rounded-xl bg-[#EAF7EE] p-5 text-[#14532D]">
        <p className="font-bold">Recibimos tu solicitud.</p>
        <p className="mt-2">
          Código de la solicitud: <strong className="font-mono">{codigo}</strong>
        </p>
        <p className="mt-2">
          Te mandamos un mail a <strong>{email}</strong> con un link para confirmarla. Si no lo ves, revisá en spam.
        </p>
      </div>
    );
  }

  const input = "w-full rounded-lg border border-[#DED9CF] px-3 py-2.5 outline-none focus:border-[#2563EB]";
  return (
    <form onSubmit={enviar} className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2">
        {(
          [
            ["baja", "Dar de baja el servicio", "Dejás de pagar. La carta sigue visible hasta el fin del mes pago."],
            ["arrepentimiento", "Me arrepiento", "Dentro de los 10 días de contratar. Se corta y te devolvemos lo pagado."],
          ] as const
        ).map(([id, t, d]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTipo(id)}
            className={`rounded-xl border p-4 text-left transition ${
              tipo === id ? "border-[#2563EB] bg-[#EAF0FF]" : "border-[#DED9CF] hover:border-[#2563EB]/50"
            }`}
          >
            <p className="font-bold text-[#151A24]">{t}</p>
            <p className="mt-1 text-xs leading-5">{d}</p>
          </button>
        ))}
      </div>
      <label className="block">
        <span className="text-sm font-semibold text-[#151A24]">Email con el que usás Carta Online</span>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={`mt-1 ${input}`} />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-[#151A24]">Nombre del restaurante (opcional)</span>
        <input value={local} onChange={(e) => setLocal(e.target.value)} className={`mt-1 ${input}`} />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-[#151A24]">Motivo (opcional)</span>
        <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3} className={`mt-1 ${input}`} />
      </label>
      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-xl bg-[#151A24] px-5 py-3 font-bold text-white transition hover:bg-black disabled:opacity-60"
      >
        {enviando ? "Enviando…" : tipo === "baja" ? "Pedir la baja" : "Pedir el arrepentimiento"}
      </button>
      <p className="text-xs leading-5">
        Al enviar te damos un código de solicitud y te mandamos un mail para confirmarla, así nadie puede dar de baja tu
        carta sin tu permiso.
      </p>
    </form>
  );
}

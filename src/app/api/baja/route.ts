import { NextResponse } from "next/server";
import { pedirBaja, type TipoBaja } from "@/lib/bajas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Botón de baja / arrepentimiento: no pide iniciar sesión.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    tipo?: string;
    email?: string;
    local?: string;
    motivo?: string;
  };
  const tipo: TipoBaja = body.tipo === "arrepentimiento" ? "arrepentimiento" : "baja";
  const email = String(body.email ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) {
    return NextResponse.json({ error: "Escribí un email válido." }, { status: 400 });
  }
  try {
    const codigo = await pedirBaja(tipo, email, String(body.local ?? ""), String(body.motivo ?? ""));
    return NextResponse.json({ codigo });
  } catch (e) {
    console.error("Pedir baja:", e);
    return NextResponse.json({ error: "No se pudo registrar. Probá de nuevo o escribinos por WhatsApp." }, { status: 500 });
  }
}

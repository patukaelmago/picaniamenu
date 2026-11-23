import { NextResponse } from "next/server";
import { confirmarBaja } from "@/lib/bajas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { codigo?: string; token?: string };
  const codigo = String(body.codigo ?? "");
  const token = String(body.token ?? "");
  if (!/^(BAJA|ARR)-[A-Z0-9]{6}$/.test(codigo) || !/^[a-f0-9]{48}$/.test(token)) {
    return NextResponse.json({ ok: false, error: "El link no es válido." }, { status: 400 });
  }
  try {
    return NextResponse.json(await confirmarBaja(codigo, token));
  } catch (e) {
    console.error("Confirmar baja:", e);
    return NextResponse.json({ ok: false, error: "No se pudo confirmar. Escribinos por WhatsApp." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { revisarCobros } from "@/lib/cobros";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Revisión diaria de cobros (la llama una tarea programada de GitHub).
// No necesita clave: corre como máximo una vez cada 20 horas aunque la llamen más veces.
export async function POST() {
  try {
    const r = await revisarCobros();
    return NextResponse.json(r);
  } catch (e) {
    console.error("Revisar cobros:", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

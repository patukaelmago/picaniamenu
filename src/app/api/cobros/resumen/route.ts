import { NextResponse } from "next/server";
import { superadminDe } from "@/lib/superadmin-server";
import { estadoDeCobros } from "@/lib/cobros";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Estado de cobro de todos los locales. Solo el superadmin.
export async function GET(request: Request) {
  if (!(await superadminDe(request))) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  const locales = await estadoDeCobros();
  return NextResponse.json({ locales: locales.map(({ pagos: _p, ...l }) => l) });
}

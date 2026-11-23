import { NextResponse } from "next/server";
import { duenoDe } from "@/lib/superadmin-server";
import { estadoDeCobros } from "@/lib/cobros";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Estado de cobro de todos los locales. Solo el superadmin.
export async function GET(request: Request) {
  if (!(await duenoDe(request))) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  const locales = await estadoDeCobros();
  const ultimosPagos = locales
    .flatMap((l) => l.pagos.map((p) => ({ ...p, local: l.nombre, localId: l.id })))
    .sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)))
    .slice(0, 8);
  return NextResponse.json({ locales: locales.map(({ pagos: _p, ...l }) => l), ultimosPagos });
}

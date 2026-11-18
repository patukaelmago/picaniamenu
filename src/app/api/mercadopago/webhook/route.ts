import { NextResponse } from "next/server";
import { mpFetch, syncSubscription, type Preapproval } from "@/lib/mercadopago";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Mercado Pago avisa cambios de suscripción. No se confía en el aviso:
// se vuelve a consultar la suscripción a Mercado Pago con nuestra clave.
export async function POST(request: Request) {
  const url = new URL(request.url);
  const body = (await request.json().catch(() => ({}))) as {
    type?: string;
    topic?: string;
    data?: { id?: string };
  };
  const type = body.type ?? body.topic ?? url.searchParams.get("type") ?? url.searchParams.get("topic") ?? "";
  const id = body.data?.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? "";

  if ((type === "subscription_preapproval" || type === "preapproval") && /^[\w-]{6,64}$/.test(id)) {
    try {
      const p = await mpFetch<Preapproval>(`/preapproval/${id}`);
      await syncSubscription(p);
    } catch (e) {
      console.error("Webhook Mercado Pago:", e);
      return NextResponse.json({ ok: false }, { status: 500 }); // Mercado Pago reintenta
    }
  }
  return NextResponse.json({ ok: true });
}

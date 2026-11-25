// Imagen de vista previa (1200x630 PNG) con el logo de cada local, para WhatsApp y redes.
import sharp from "sharp";
import { getTenantShareInfo } from "@/lib/tenant-share";

// Logos guardados en el sitio, por si el local no tiene logo cargado en el panel.
const STATIC_LOGOS: Record<string, string> = {
  picana: "/logorecortado_azul.png",
  laroti: "/laroti_logo_light.png",
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const W = 1200;
const H = 630;
const FALLBACK = "/carta-online-logo.png";

async function load(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

async function render(logo: Buffer): Promise<Buffer> {
  const fitted = await sharp(logo)
    .resize({ width: W - 200, height: H - 160, fit: "inside", withoutEnlargement: false })
    .png()
    .toBuffer();
  return sharp({ create: { width: W, height: H, channels: 4, background: "#ffffff" } })
    .composite([{ input: fitted, gravity: "center" }])
    .png()
    .toBuffer();
}

export async function GET(req: Request, { params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId: raw } = await params;
  const tenantId = raw.toLowerCase().replace(/[^a-z0-9-]/g, "");
  const origin = new URL(req.url).origin;

  const info = tenantId ? await getTenantShareInfo(tenantId) : null;
  const staticLogo = STATIC_LOGOS[tenantId] ?? "";

  const candidates = [info?.logoUrl, staticLogo && `${origin}${staticLogo}`, `${origin}${FALLBACK}`].filter(
    Boolean
  ) as string[];

  let png: Buffer | null = null;
  let isFallback = false;
  for (const url of candidates) {
    const buf = await load(url);
    if (!buf) continue;
    try {
      png = await render(buf);
      isFallback = url.endsWith(FALLBACK);
      break;
    } catch {}
  }

  if (!png) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": isFallback
        ? "public, max-age=300, s-maxage=300"
        : "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
    },
  });
}

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

// Pasa "43 100% 94%" (HSL del panel) o "#rrggbb" a RGB.
function toRgb(color: string): { r: number; g: number; b: number } {
  const c = (color || "").trim();
  const hex = c.match(/^#?([0-9a-f]{6})$/i);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  const hsl = c.replace(/^hsla?\(|\)$/g, "").match(/(-?[\d.]+)[,\s]+([\d.]+)%[,\s]+([\d.]+)%/);
  if (!hsl) return { r: 255, g: 255, b: 255 };
  const h = ((Number(hsl[1]) % 360) + 360) % 360;
  const s = Number(hsl[2]) / 100;
  const l = Number(hsl[3]) / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));
  return { r: f(0), g: f(8), b: f(4) };
}

// Si el logo tiene partes transparentes, el fondo es el color del encabezado del local.
// Si no, se usa el color del borde del propio logo para que no quede un recuadro.
async function render(logo: Buffer, navBg: string): Promise<Buffer> {
  const img = sharp(logo);
  const meta = await img.metadata();
  let background = toRgb(navBg);
  let transparent = false;
  if (meta.hasAlpha) {
    const { channels } = await sharp(logo).stats();
    transparent = (channels[3]?.min ?? 255) < 250;
  }
  if (!transparent) {
    const corner = await sharp(logo).extract({ left: 0, top: 0, width: 1, height: 1 }).removeAlpha().raw().toBuffer();
    background = { r: corner[0], g: corner[1], b: corner[2] };
  }
  const fitted = await sharp(logo)
    .resize({ width: W - 200, height: H - 160, fit: "inside", withoutEnlargement: false })
    .png()
    .toBuffer();
  return sharp({ create: { width: W, height: H, channels: 4, background: { ...background, alpha: 1 } } })
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
      isFallback = url.endsWith(FALLBACK);
      png = await render(buf, isFallback ? "#ffffff" : info?.navBg ?? "");
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

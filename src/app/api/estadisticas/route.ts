import { NextResponse } from "next/server";
import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROPERTY = "properties/515545079";
const CACHE_MS = 10 * 60 * 1000;

const analytics = new BetaAnalyticsDataClient();
const cache = new Map<string, { at: number; data: unknown }>();

// Mismas reglas que el panel: superadmin, supervisor del local o admin del local.
async function canSeeTenant(email: string, tenantId: string) {
  const superSnap = await adminDb.doc(`superadmins/${email}`).get();
  if (superSnap.exists && superSnap.data()?.enabled === true) return true;

  const supSnap = await adminDb.doc(`supervisors/${email}`).get();
  if (supSnap.exists && supSnap.data()?.enabled === true) {
    const tenants: string[] = supSnap.data()?.tenants ?? [];
    return tenants.includes(tenantId);
  }

  const adminSnap = await adminDb.doc(`tenants/${tenantId}/admins/${email}`).get();
  return adminSnap.exists && adminSnap.data()?.enabled === true;
}

const pageFilter = (tenantId: string) => ({
  orGroup: {
    expressions: [
      { filter: { fieldName: "pagePath", stringFilter: { matchType: "EXACT" as const, value: `/menu/${tenantId}` } } },
      { filter: { fieldName: "pagePath", stringFilter: { matchType: "BEGINS_WITH" as const, value: `/menu/${tenantId}/` } } },
    ],
  },
});

const eventFilter = (tenantId: string, eventName: string) => ({
  andGroup: {
    expressions: [
      { filter: { fieldName: "eventName", stringFilter: { matchType: "EXACT" as const, value: eventName } } },
      { filter: { fieldName: "customEvent:local", stringFilter: { matchType: "EXACT" as const, value: tenantId } } },
    ],
  },
});

async function topList(tenantId: string, eventName: string, dimension: string) {
  const [res] = await analytics.runReport({
    property: PROPERTY,
    dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
    dimensions: [{ name: dimension }],
    metrics: [{ name: "eventCount" }],
    dimensionFilter: eventFilter(tenantId, eventName),
    orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
    limit: 10,
  });
  return (res.rows ?? []).map((r) => ({
    nombre: r.dimensionValues?.[0]?.value ?? "",
    veces: Number(r.metricValues?.[0]?.value ?? 0),
  }));
}

async function buildStats(tenantId: string) {
  const [daily] = await analytics.runReport({
    property: PROPERTY,
    dateRanges: [{ startDate: "29daysAgo", endDate: "today" }],
    dimensions: [{ name: "date" }],
    metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }],
    dimensionFilter: pageFilter(tenantId),
    orderBys: [{ dimension: { dimensionName: "date" } }],
  });

  const [totals] = await analytics.runReport({
    property: PROPERTY,
    dateRanges: [
      { startDate: "6daysAgo", endDate: "today", name: "semana" },
      { startDate: "29daysAgo", endDate: "today", name: "mes" },
    ],
    metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }],
    dimensionFilter: pageFilter(tenantId),
  });

  const totalFor = (rangeName: string) => {
    const row = (totals.rows ?? []).find((r) =>
      r.dimensionValues?.some((d) => d.value === rangeName)
    ) ?? (totals.rows ?? [])[rangeName === "semana" ? 0 : 1];
    return {
      visitas: Number(row?.metricValues?.[0]?.value ?? 0),
      personas: Number(row?.metricValues?.[1]?.value ?? 0),
    };
  };

  const [platos, categorias] = await Promise.all([
    topList(tenantId, "ver_plato", "customEvent:plato").catch(() => []),
    topList(tenantId, "ver_categoria", "customEvent:categoria").catch(() => []),
  ]);

  return {
    semana: totalFor("semana"),
    mes: totalFor("mes"),
    porDia: (daily.rows ?? []).map((r) => ({
      fecha: r.dimensionValues?.[0]?.value ?? "",
      visitas: Number(r.metricValues?.[0]?.value ?? 0),
    })),
    platos,
    categorias,
    actualizado: new Date().toISOString(),
  };
}

export async function GET(request: Request) {
  const tenantId = new URL(request.url).searchParams.get("tenant")?.trim() ?? "";
  if (!/^[a-z0-9-]{1,60}$/i.test(tenantId)) {
    return NextResponse.json({ error: "Local inválido" }, { status: 400 });
  }

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });

  let email = "";
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    email = (decoded.email ?? "").toLowerCase();
  } catch {
    return NextResponse.json({ error: "Sesión vencida" }, { status: 401 });
  }
  if (!email || !(await canSeeTenant(email, tenantId))) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  const cached = cache.get(tenantId);
  if (cached && Date.now() - cached.at < CACHE_MS) return NextResponse.json(cached.data);

  try {
    const data = await buildStats(tenantId);
    cache.set(tenantId, { at: Date.now(), data });
    return NextResponse.json(data);
  } catch (e) {
    console.error("Estadísticas:", e);
    return NextResponse.json({ error: "No se pudieron leer las estadísticas" }, { status: 502 });
  }
}

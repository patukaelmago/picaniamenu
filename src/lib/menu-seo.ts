// Datos de la carta leídos en el servidor, solo para Google (título y datos estructurados).
// No cambian lo que ve el cliente: la carta visible se sigue cargando igual que siempre.
import { adminDb } from "@/lib/firebase-admin";

export type MenuSeo = {
  name: string;
  active: boolean;
  sections: { name: string; items: { name: string; description: string; price: number }[] }[];
};

const withTimeout = <T,>(p: Promise<T>, ms: number) =>
  Promise.race([p, new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);

export async function getMenuSeo(tenantId: string): Promise<MenuSeo | null> {
  try {
    return await withTimeout(
      (async () => {
        const base = adminDb.collection("tenants").doc(tenantId);
        const [tenant, restaurant, cats, items] = await Promise.all([
          base.get(),
          base.collection("settings").doc("restaurant").get(),
          base.collection("categories").get(),
          base.collection("menuItems").where("isVisible", "==", true).get(),
        ]);

        const categories = cats.docs
          .map((d) => ({ ...(d.data() as Record<string, unknown>), id: d.id }) as Record<string, unknown> & { id: string })
          .filter((c) => c.isVisible !== false)
          .sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0));

        const byCategory = new Map<string, MenuSeo["sections"][number]["items"]>();
        items.docs
          .map((d) => d.data())
          .sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0))
          .forEach((i) => {
            const list = byCategory.get(String(i.categoryId)) ?? [];
            list.push({
              name: String(i.name ?? "").trim(),
              description: String(i.description ?? "").trim(),
              price: Number(i.price ?? 0),
            });
            byCategory.set(String(i.categoryId), list);
          });

        return {
          name: String(restaurant.data()?.name ?? "").trim(),
          active: tenant.data()?.active !== false,
          sections: categories
            .map((c) => ({ name: String(c.name ?? "").trim(), items: byCategory.get(c.id) ?? [] }))
            .filter((s) => s.name && s.items.length > 0),
        };
      })(),
      6000
    );
  } catch {
    return null;
  }
}

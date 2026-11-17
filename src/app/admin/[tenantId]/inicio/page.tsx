"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { ExternalLink, ImagePlus, Loader2, PlusCircle, QrCode } from "lucide-react";
import { db } from "@/lib/firebase";
import { useTenantUI } from "@/hooks/use-tenant-ui";
import { Card, CardContent } from "@/components/ui/card";
import {
  parseMenuVariantSchedule,
  resolveMenuVariant,
  type MenuVariant,
} from "@/lib/menu-variant-schedule";

type Summary = {
  name: string;
  categories: number;
  items: number;
  visibleItems: number;
  withoutPhoto: number;
  published: MenuVariant;
};

export default function TenantHomePage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = use(params);
  const ui = useTenantUI(tenantId);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [restaurant, variants, categories, items] = await Promise.all([
          getDoc(doc(db, "tenants", tenantId, "settings", "restaurant")),
          getDoc(doc(db, "tenants", tenantId, "settings", "menuVariants")),
          getDocs(collection(db, "tenants", tenantId, "categories")),
          getDocs(collection(db, "tenants", tenantId, "menuItems")),
        ]);
        if (cancelled) return;
        const variantData = variants.data();
        const manual: MenuVariant = variantData?.activeVariant === "B" ? "B" : "A";
        const itemData = items.docs.map((d) => d.data());
        setSummary({
          name: String(restaurant.data()?.name ?? "").trim(),
          categories: categories.size,
          items: items.size,
          visibleItems: itemData.filter((i) => i.isVisible !== false).length,
          withoutPhoto: itemData.filter((i) => !String(i.imageUrl ?? "").trim()).length,
          published: resolveMenuVariant(
            manual,
            parseMenuVariantSchedule(variantData?.automation)
          ),
        });
      } catch (e) {
        console.error(e);
        if (!cancelled) setError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  const cardStyle = {
    backgroundColor: `hsl(${ui.adminCard})`,
    color: `hsl(${ui.adminCardForeground})`,
  };
  const headerStyle = {
    backgroundColor: `hsl(${ui.adminSidebarBg})`,
    color: `hsl(${ui.adminSidebarText})`,
  };
  // Los botones van sobre fondo de tarjeta para que se vean aunque el fondo
  // del panel sea del mismo color que la barra lateral.
  const actionStyle = {
    backgroundColor: `hsl(${ui.adminCard})`,
    color: `hsl(${ui.adminCardForeground})`,
    borderColor: `hsl(${ui.adminAccent})`,
  };

  if (error) {
    return <p className="p-6 text-sm">No se pudo cargar el resumen. Probá recargar la página.</p>;
  }

  if (!summary) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  const stats = [
    { label: "Categorías", value: summary.categories },
    { label: "Platos", value: summary.items },
    { label: "Platos visibles", value: summary.visibleItems },
    { label: "Platos sin foto", value: summary.withoutPhoto },
  ];

  const actionClass =
    "flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-semibold shadow-sm transition-opacity hover:opacity-90";

  return (
    <div
      className="min-h-screen w-full space-y-4 p-0 sm:space-y-6 sm:p-2"
      style={{ backgroundColor: `hsl(${ui.adminBackground})` }}
    >
      <div
        className="rounded-xl border-l-4 px-5 py-5 shadow-sm sm:px-7 sm:py-6"
        style={{ ...headerStyle, borderLeftColor: `hsl(${ui.adminAccent})` }}
      >
        <h1 className="font-headline text-2xl font-bold sm:text-3xl">
          {summary.name || tenantId}
        </h1>
        <p className="mt-1 text-sm opacity-75">
          Tus clientes están viendo la Carta {summary.published}.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-0 shadow-sm ring-1 ring-black/5" style={cardStyle}>
            <CardContent className="p-4">
              <p className="text-3xl font-bold">{stat.value}</p>
              <p className="text-sm opacity-70">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {summary.categories === 0 && (
        <Card className="border-0 shadow-sm ring-1 ring-black/5" style={cardStyle}>
          <CardContent className="space-y-2 p-4 text-sm sm:p-5">
            <p className="font-semibold">Armá tu carta en 3 pasos:</p>
            <ol className="space-y-1">
              <li>1. Creá una categoría (por ejemplo "Entradas").</li>
              <li>2. Agregá tus platos.</li>
              <li>3. Descargá tu QR y compartilo.</li>
            </ol>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Link href={`/admin/${tenantId}/menu`} className={actionClass} style={actionStyle}>
          <PlusCircle className="h-4 w-4" />
          {summary.categories === 0 ? "Empezar mi carta" : "Editar mi carta"}
        </Link>
        <a
          href={`/menu/${tenantId}`}
          target="_blank"
          rel="noopener noreferrer"
          className={actionClass}
          style={actionStyle}
        >
          <ExternalLink className="h-4 w-4" />
          Ver mi carta
        </a>
        <Link href={`/admin/${tenantId}/qr`} className={actionClass} style={actionStyle}>
          <QrCode className="h-4 w-4" />
          Descargar QR
        </Link>
      </div>

      {summary.withoutPhoto > 0 && summary.items > 0 && (
        <p className="flex items-center gap-2 text-sm opacity-80">
          <ImagePlus className="h-4 w-4 shrink-0" />
          Los platos con foto se venden mejor. En Menú, tocá el recuadro "Foto" de cada plato para agregarla.
        </p>
      )}
    </div>
  );
}

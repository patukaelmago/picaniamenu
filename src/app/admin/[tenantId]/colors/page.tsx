"use client";

import { use, useEffect, useMemo, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Paintbrush, RefreshCw, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { getTenantUI } from "@/lib/tenant-ui";
import {
  applyBrandColors,
  applyColorOverrides,
  TENANT_COLOR_FIELDS,
  type BrandColors,
  type TenantColorKey,
  type TenantColorOverrides,
} from "@/lib/tenant-ui/brand-colors";

function hexToHsl(hex: string) {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    if (max === g) h = (b - r) / d + 2;
    if (max === b) h = (r - g) / d + 4;
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function hslToHex(value: string, fallback = "#000000") {
  const parts = value.match(/[\d.]+/g)?.map(Number);
  if (!parts || parts.length < 3) return fallback;

  const [h, sRaw, lRaw] = parts;
  const s = sRaw / 100;
  const l = lRaw / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  const channel = (number: number) =>
    Math.round((number + m) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

function colorsToHex(
  values: ReturnType<typeof getTenantUI>
): Record<TenantColorKey, string> {
  return Object.fromEntries(
    TENANT_COLOR_FIELDS.map(({ key }) => [key, hslToHex(values[key] as string)])
  ) as Record<TenantColorKey, string>;
}

export default function TenantColorsPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = use(params);
  const [primaryColor, setPrimaryColor] = useState("#1d2f58");
  const [backgroundColor, setBackgroundColor] = useState("#fff7e3");
  const [accentColor, setAccentColor] = useState("#ff6b1a");
  const [colors, setColors] = useState<Record<TenantColorKey, string>>(
    {} as Record<TenantColorKey, string>
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadColors() {
      try {
        const base = getTenantUI(tenantId);
        const snapshot = await getDoc(
          doc(db, "tenants", tenantId, "settings", "ui")
        );
        const data = snapshot.exists() ? snapshot.data() : {};
        const brandColors = (data?.brandColors ?? {}) as BrandColors;
        const generated = applyBrandColors(base, brandColors);
        const effective = applyColorOverrides(generated, data?.colorOverrides);

        setPrimaryColor(hslToHex(brandColors.primary ?? generated.navBg, "#1d2f58"));
        setBackgroundColor(
          hslToHex(brandColors.background ?? generated.background, "#fff7e3")
        );
        setAccentColor(hslToHex(brandColors.accent ?? generated.accent, "#ff6b1a"));
        setColors(colorsToHex(effective));
      } catch (error) {
        console.error(error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar los colores.",
        });
      } finally {
        setLoading(false);
      }
    }

    loadColors();
  }, [tenantId]);

  const groupedFields = useMemo(
    () => ({
      "Carta pública": TENANT_COLOR_FIELDS.filter(
        (field) => field.group === "Carta pública"
      ),
      Administración: TENANT_COLOR_FIELDS.filter(
        (field) => field.group === "Administración"
      ),
    }),
    []
  );

  function generatePalette() {
    const generated = applyBrandColors(getTenantUI(tenantId), {
      primary: hexToHsl(primaryColor),
      background: hexToHsl(backgroundColor),
      accent: hexToHsl(accentColor),
    });
    setColors(colorsToHex(generated));
    toast({
      title: "Paleta generada",
      description: "Ahora podés ajustar cada color por separado.",
    });
  }

  async function saveColors() {
    if (saving) return;
  
    setSaving(true);
  
    try {
      const colorOverrides: TenantColorOverrides = {};
  
      TENANT_COLOR_FIELDS.forEach(({ key }) => {
        colorOverrides[key] = hexToHsl(colors[key]);
      });
  
      await setDoc(
        doc(db, "tenants", tenantId, "settings", "ui"),
        {
          brandColors: {
            primary: hexToHsl(primaryColor),
            background: hexToHsl(backgroundColor),
            accent: hexToHsl(accentColor),
          },
          colorOverrides,
        },
        { merge: true }
      );
  
      toast({
        title: "Colores guardados",
        description: "La carta y el panel ya usan la nueva paleta.",
      });
  
      window.setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      console.error(error);
  
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron guardar los colores.",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <p className="p-8 text-center text-sm text-muted-foreground animate-pulse">
        Cargando colores…
      </p>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="font-headline text-3xl font-bold">Colores</h1>
        <p className="text-muted-foreground">
          Generá una paleta y personalizá cada parte del tenant.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Paintbrush className="h-5 w-5" />
            Generador de paleta
          </CardTitle>
          <CardDescription>
            Elegí tres tonos para crear automáticamente todos los colores.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                label: "Color principal",
                value: primaryColor,
                setter: setPrimaryColor,
              },
              {
                label: "Color de fondo",
                value: backgroundColor,
                setter: setBackgroundColor,
              },
              {
                label: "Color de acento",
                value: accentColor,
                setter: setAccentColor,
              },
            ].map(({ label, value, setter }) => (
              <label key={label} className="space-y-2 text-sm font-medium">
                <span>{label}</span>
                <div className="flex items-center gap-3 rounded-md border p-2">
                  <span className="h-10 w-14 shrink-0 overflow-hidden rounded border border-foreground/35">
                    <input
                      type="color"
                      value={value}
                      onChange={(event) => setter(event.target.value)}
                      className="h-full w-full cursor-pointer appearance-none border-0 bg-transparent p-0 [&::-moz-color-swatch]:border-0 [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0"
                    />
                  </span>
                  <span className="font-mono text-xs uppercase">{value}</span>
                </div>
              </label>
            ))}
          </div>

          <Button type="button" onClick={generatePalette}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Generar todos los colores
          </Button>
        </CardContent>
      </Card>

      {Object.entries(groupedFields).map(([group, fields]) => (
        <Card key={group}>
          <CardHeader>
            <CardTitle>{group}</CardTitle>
            <CardDescription>
              Ajustes avanzados de fondos, textos, íconos, botones y estados.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {fields.map(({ key, label }) => (
              <label key={key} className="space-y-2 text-sm font-medium">
                <span>{label}</span>
                <div className="flex items-center gap-3 rounded-md border p-2">
                  <span className="h-9 w-12 shrink-0 overflow-hidden rounded border border-foreground/35">
                    <input
                      type="color"
                      value={colors[key]}
                      onChange={(event) =>
                        setColors((current) => ({
                          ...current,
                          [key]: event.target.value,
                        }))
                      }
                      className="h-full w-full cursor-pointer appearance-none border-0 bg-transparent p-0 [&::-moz-color-swatch]:border-0 [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0"
                    />
                  </span>
                  <span className="font-mono text-xs uppercase">{colors[key]}</span>
                </div>
              </label>
            ))}
          </CardContent>
        </Card>
      ))}

      <div className="fixed bottom-0 right-0 z-40 flex w-full justify-start border-t border-border bg-background/95 p-4 shadow-lg backdrop-blur md:w-[calc(100%-var(--sidebar-width))]">
        <Button type="button" onClick={saveColors} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Guardando…" : "Guardar colores"}
        </Button>
      </div>
    </div>
  );
}

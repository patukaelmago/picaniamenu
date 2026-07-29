"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { ArrowLeft, Building2, Loader2 } from "lucide-react";

import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

function normalizeTenantId(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

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

export default function NewTenantPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#1d2f58");
  const [backgroundColor, setBackgroundColor] = useState("#fff7e3");
  const [accentColor, setAccentColor] = useState("#ff6b1a");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [idWasEdited, setIdWasEdited] = useState(false);

  function handleName(value: string) {
    setName(value);
    if (!idWasEdited) setTenantId(normalizeTenantId(value));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const id = normalizeTenantId(tenantId);
    const email = adminEmail.trim().toLowerCase();

    if (!id || !name.trim() || !email) {
      toast({
        variant: "destructive",
        title: "Faltan datos",
        description: "Completá ID, nombre y email administrador.",
      });
      return;
    }

    try {
      setSaving(true);
      const tenantRef = doc(db, "tenants", id);
      const existing = await getDoc(tenantRef);

      if (existing.exists()) {
        toast({
          variant: "destructive",
          title: "Ese tenant ya existe",
          description: "Elegí otro identificador.",
        });
        return;
      }

      await setDoc(tenantRef, {
        name: name.trim(),
        active,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await setDoc(doc(db, "tenants", id, "admins", email), {
        enabled: true,
        email,
        createdAt: serverTimestamp(),
      });

      await setDoc(doc(db, "tenants", id, "settings", "restaurant"), {
        name: name.trim(),
        currency: "ARS",
        logoUrl: logoUrl.trim(),
        websiteUrl: "",
        showLogo: true,
        showName: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await setDoc(doc(db, "tenants", id, "settings", "ui"), {
        carouselImages: [],
        brandColors: {
          primary: hexToHsl(primaryColor),
          background: hexToHsl(backgroundColor),
          accent: hexToHsl(accentColor),
        },
        updatedAt: serverTimestamp(),
      });

      toast({
        title: "Tenant creado",
        description: `${name.trim()} ya está listo para configurar.`,
      });

      router.push(`/admin/${id}/settings`);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "No se pudo crear",
        description: "Revisá los permisos de Firestore e intentá nuevamente.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <Button
        type="button"
        variant="ghost"
        onClick={() => router.push("/select-tenant")}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </Button>

      <Card>
        <CardHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Crear nuevo tenant</CardTitle>
          <CardDescription>
            Crea el restaurante y su acceso administrativo en Firestore.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tenant-name">Nombre comercial</Label>
                <Input
                  id="tenant-name"
                  value={name}
                  onChange={(event) => handleName(event.target.value)}
                  placeholder="Ej: Restaurante Demo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenant-id">ID del tenant</Label>
                <Input
                  id="tenant-id"
                  value={tenantId}
                  onChange={(event) => {
                    setIdWasEdited(true);
                    setTenantId(normalizeTenantId(event.target.value));
                  }}
                  placeholder="restaurante-demo"
                />
                <p className="text-xs text-muted-foreground">
                  Se usará en /menu/{tenantId || "restaurante-demo"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-email">Email administrador</Label>
              <Input
                id="admin-email"
                type="email"
                value={adminEmail}
                onChange={(event) => setAdminEmail(event.target.value)}
                placeholder="admin@restaurante.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo-url">URL del logo</Label>
              <Input
                id="logo-url"
                type="url"
                value={logoUrl}
                onChange={(event) => setLogoUrl(event.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ["Color principal", primaryColor, setPrimaryColor],
                ["Color de fondo", backgroundColor, setBackgroundColor],
                ["Color de acento", accentColor, setAccentColor],
              ].map(([label, value, setter]) => (
                <label key={label as string} className="space-y-2 text-sm font-medium">
                  <span>{label as string}</span>
                  <div className="flex items-center gap-3 rounded-md border p-2">
                    <input
                      type="color"
                      value={value as string}
                      onChange={(event) =>
                        (setter as React.Dispatch<React.SetStateAction<string>>)(
                          event.target.value
                        )
                      }
                      className="h-9 w-12 cursor-pointer rounded border-0 bg-transparent"
                    />
                    <span className="font-mono text-xs">{value as string}</span>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label htmlFor="tenant-active">Tenant activo</Label>
                <p className="text-sm text-muted-foreground">
                  Aparecerá en el selector de restaurantes.
                </p>
              </div>
              <Switch id="tenant-active" checked={active} onCheckedChange={setActive} />
            </div>

            <Button type="submit" disabled={saving} className="w-full">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? "Creando tenant..." : "Crear tenant"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { use, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

import {
  getRestaurantSettings,
  saveRestaurantSettings,
} from "@/lib/settings-service";

import { db, storage } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  type UploadTask,
} from "firebase/storage";

export default function TenantSettingsPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = use(params);

  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("ARS");

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrlInput, setLogoUrlInput] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [carouselImages, setCarouselImages] = useState<string[]>(["", "", "", ""]);

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const settings = await getRestaurantSettings(tenantId);

        setName(settings.name || tenantId);
        setCurrency(settings.currency || "ARS");
        setLogoUrlInput(settings.logoUrl ?? "");
        setLogoPreview(settings.logoUrl || null);

        // CARGAR CAROUSEL
        const refDoc = doc(db, "tenants", tenantId, "settings", "ui");
        const snap = await getDoc(refDoc);

        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.carouselImages)) {
            setCarouselImages(data.carouselImages);
          }
        }
      } catch (e) {
        console.error(e);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar los ajustes.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [tenantId]);

  function handleLogoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setLogoFile(file);

    if (file) {
      const reader = new FileReader();
      reader.onload = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setLogoPreview(logoUrlInput || null);
    }
  }

  async function handleSave() {
    setIsSaving(true);
    setProgress(0);

    try {
      let finalLogoUrl = logoUrlInput.trim();

      if (logoFile) {
        const ext = logoFile.name.split(".").pop();
        const storagePath = `tenants/${tenantId}/logos/logo-${Date.now()}.${ext}`;
        const storageRef = ref(storage, storagePath);

        const task: UploadTask = uploadBytesResumable(storageRef, logoFile);

        finalLogoUrl = await new Promise((resolve, reject) => {
          task.on(
            "state_changed",
            (snap) =>
              setProgress(
                Math.round((snap.bytesTransferred / snap.totalBytes) * 100)
              ),
            (err) => reject(err),
            async () => resolve(await getDownloadURL(task.snapshot.ref))
          );
        });
      }

      await saveRestaurantSettings(tenantId, {
        name: name.trim(),
        currency: currency.trim(),
        logoUrl: finalLogoUrl,
      });

      // GUARDAR CAROUSEL
      const refDoc = doc(db, "tenants", tenantId, "settings", "ui");

      await setDoc(
        refDoc,
        {
          carouselImages: carouselImages.filter((img) => img.trim() !== ""),
        },
        { merge: true }
      );

      toast({
        title: "Ajustes guardados",
        description: "Todo actualizado correctamente.",
      });
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron guardar los cambios.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading)
    return (
      <p className="p-8 text-center text-muted-foreground animate-pulse">
        Cargando ajustes...
      </p>
    );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">
          Ajustes del Cliente
        </h1>
        <p className="text-muted-foreground">
          Configuración para {tenantId}
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* IDENTIDAD */}
        <Card>
          <CardHeader>
            <CardTitle>Identidad Visual</CardTitle>
            <CardDescription>
              Nombre y logo del negocio
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div>
              <Label>Nombre</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <Label>Logo (archivo)</Label>
              <Input
                type="file"
                ref={fileInputRef}
                onChange={handleLogoFileChange}
              />
              {progress > 0 && isSaving && (
                <p className="text-xs">Subiendo: {progress}%</p>
              )}
            </div>

            <div>
              <Label>Logo URL</Label>
              <Input
                value={logoUrlInput}
                onChange={(e) => setLogoUrlInput(e.target.value)}
              />
            </div>

            <div>
              <Label>Preview</Label>
              <div className="h-24 w-24 border flex items-center justify-center">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  "Sin logo"
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CAROUSEL */}
        <Card>
          <CardHeader>
            <CardTitle>Carousel</CardTitle>
            <CardDescription>
              URLs de imágenes del carrusel
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {carouselImages.map((img, i) => (
              <Input
                key={i}
                placeholder={`Imagen ${i + 1}`}
                value={img}
                onChange={(e) => {
                  const copy = [...carouselImages];
                  copy[i] = e.target.value;
                  setCarouselImages(copy);
                }}
              />
            ))}
          </CardContent>
        </Card>
      </div>

      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving ? "Guardando..." : "Guardar cambios"}
      </Button>
    </div>
  );
}
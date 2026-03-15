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
import { Landmark, Upload, ImageIcon } from "lucide-react";

import {
  getRestaurantSettings,
  saveRestaurantSettings,
  type RestaurantSettings,
} from "@/lib/settings-service";

import { storage } from "@/lib/firebase";
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
            (snap) => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
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

      setLogoUrlInput(finalLogoUrl);
      setLogoFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      toast({
        title: "Ajustes guardados",
        description: "La configuración se actualizó correctamente.",
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

  if (isLoading) return <p className="p-8 text-center">Cargando ajustes...</p>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Ajustes del Cliente</h1>
        <p className="text-muted-foreground">Configuración para {tenantId}</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Identidad Visual</CardTitle>
            <CardDescription>Configurá el nombre y logo que verán tus clientes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="res-name">Nombre Comercial</Label>
              <Input id="res-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo-file">Logo (Subir archivo)</Label>
              <Input id="logo-file" type="file" ref={fileInputRef} onChange={handleLogoFileChange} accept="image/*" />
              {progress > 0 && isSaving && <p className="text-xs text-muted-foreground">Subiendo: {progress}%</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo-url">URL del Logo (Opcional)</Label>
              <Input id="logo-url" value={logoUrlInput} onChange={(e) => setLogoUrlInput(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Vista Previa</Label>
              <div className="h-24 w-24 rounded-md border bg-muted flex items-center justify-center overflow-hidden">
                {logoPreview ? (
                  <img src={logoPreview} alt="Preview" className="h-full w-full object-contain" />
                ) : (
                  <span className="text-xs text-muted-foreground">Sin logo</span>
                )}
              </div>
            </div>

            <Button onClick={handleSave} disabled={isSaving} className="w-full">
              {isSaving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

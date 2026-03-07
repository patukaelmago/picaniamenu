"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
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

export default function AdminSettingsPage() {
  const params = useParams();
  const tenantId = Array.isArray(params?.tenantId)
    ? params.tenantId[0]
    : (params?.tenantId as string) || "picana";

  const [name, setName] = useState("Picaña");
  const [currency, setCurrency] = useState("ARS");

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrlInput, setLogoUrlInput] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);

        const settings: RestaurantSettings =
          await getRestaurantSettings(tenantId);

        if (!mountedRef.current) return;

        setName(settings.name || tenantId);
        setCurrency(settings.currency || "ARS");
        setLogoUrlInput(settings.logoUrl ?? "");
        setLogoPreview(settings.logoUrl || null);
      } catch (error) {
        console.error(error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar los ajustes del restaurante.",
        });
      } finally {
        if (mountedRef.current) setIsLoading(false);
      }
    };

    load();
  }, [tenantId]);

  function handleLogoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setLogoFile(file);
    setProgress(0);

    if (!file) {
      setLogoPreview(logoUrlInput || null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (mountedRef.current) {
        setLogoPreview(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  }

  function guessExt(file: File | null) {
    if (!file) return "png";
    const ext = file.name.split(".").pop()?.toLowerCase();
    return ext && ["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext)
      ? ext
      : "png";
  }

  async function handleSave() {
    setIsSaving(true);
    setProgress(0);

    try {
      let finalLogoUrl = logoUrlInput.trim();

      if (logoFile) {
        const ext = guessExt(logoFile);
        const storagePath = `tenants/${tenantId}/logos/restaurant-logo-${Date.now()}.${ext}`;
        const storageRef = ref(storage, storagePath);
        const metadata = {
          contentType: logoFile.type || `image/${ext}`,
        };

        finalLogoUrl = await new Promise<string>((resolve, reject) => {
          const task: UploadTask = uploadBytesResumable(
            storageRef,
            logoFile,
            metadata
          );

          task.on(
            "state_changed",
            (snap) => {
              const pct =
                (snap.bytesTransferred / snap.totalBytes) * 100;
              setProgress(Math.round(pct));
            },
            (err) => reject(err),
            async () => resolve(await getDownloadURL(task.snapshot.ref))
          );
        });
      }

      await saveRestaurantSettings(tenantId, {
        name: name.trim(),
        currency: (currency || "ARS").trim(),
        logoUrl: finalLogoUrl,
      });

      if (!mountedRef.current) return;

      setLogoUrlInput(finalLogoUrl);
      setLogoPreview(finalLogoUrl || null);
      setLogoFile(null);
      setProgress(0);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      toast({
        title: "Ajustes guardados",
        description: "Los cambios del restaurante se guardaron correctamente.",
      });
    } catch (error: unknown) {
      console.error(error);

      const message =
        error instanceof Error
          ? error.message
          : "No se pudieron guardar los ajustes. Revisá la conexión o los permisos de Firebase Storage.";

      toast({
        variant: "destructive",
        title: "Error",
        description: message,
      });
    } finally {
      if (mountedRef.current) setIsSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">
          Ajustes del Restaurante
        </h1>
        <p className="text-muted-foreground">
          Configurá los detalles de tu restaurante.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Detalles del Restaurante</CardTitle>
            <CardDescription>
              Información básica que se mostrará a tus clientes.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {isLoading ? (
              <p>Cargando ajustes...</p>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="restaurant-name">
                    <Landmark className="mr-2 inline-block h-4 w-4" />
                    Nombre del Restaurante
                  </Label>
                  <Input
                    id="restaurant-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logo-file">
                    <Upload className="mr-2 inline-block h-4 w-4" />
                    Logo del Restaurante (archivo)
                  </Label>
                  <Input
                    id="logo-file"
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                    onChange={handleLogoFileChange}
                  />
                  {progress > 0 && isSaving && (
                    <p className="text-xs text-muted-foreground">
                      Subiendo… {progress}%
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Si subís un archivo, se usará en lugar de la URL.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logo-url">
                    <ImageIcon className="mr-2 inline-block h-4 w-4" />
                    URL del Logo (opcional)
                  </Label>
                  <Input
                    id="logo-url"
                    placeholder="https://tu-sitio.com/logo.png"
                    value={logoUrlInput}
                    onChange={(e) => {
                      setLogoUrlInput(e.target.value);
                      if (!logoFile) {
                        setLogoPreview(e.target.value || null);
                      }
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Vista previa del logo</Label>
                  {logoPreview ? (
                    <div className="inline-flex items-center justify-center rounded-md border bg-muted p-2">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="h-16 w-16 object-contain"
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Todavía no hay logo seleccionado.
                    </p>
                  )}
                </div>

                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
"use client";

import { useEffect, useRef, useState } from "react";
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
import { Landmark, Wallet, Upload, ImageIcon } from "lucide-react";

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

// -------------------------------------------------------------

export default function AdminSettingsPage() {
  // -------- estados del formulario --------
  const [name, setName] = useState("Picaña");
  const [currency, setCurrency] = useState("ARS");

  // logo subido como archivo
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // logo por URL (texto)
  const [logoUrlInput, setLogoUrlInput] = useState("");

  // URL que se usa para la miniatura (puede ser dataURL o URL real)
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // progreso de upload
  const [progress, setProgress] = useState<number>(0);

  // para resetear el <input type=file>
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // flag para evitar setState después del unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ================== CARGAR DATOS INICIALES ==================
  useEffect(() => {
    const load = async () => {
      try {
        const settings: RestaurantSettings = await getRestaurantSettings();
        if (!mountedRef.current) return;
        setName(settings.name);
        setCurrency(settings.currency);
        setLogoUrlInput(settings.logoUrl ?? "");
        setLogoPreview(settings.logoUrl || null);
      } catch (e) {
        console.error(e);
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
  }, []);

  // ================== MANEJO DE LOGO (ARCHIVO) ==================

  function handleLogoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setLogoFile(file);
    setProgress(0);

    if (file) {
      // Vista previa local
      const reader = new FileReader();
      reader.onload = () => {
        if (mountedRef.current) setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      // Si borrás el archivo, volvemos a mostrar la URL (si hay)
      setLogoPreview(logoUrlInput || null);
    }
  }

  // util para extensión
  function guessExt(f: File | null) {
    if (!f) return "png";
    const ext = f.name.split(".").pop()?.toLowerCase();
    return ext && ["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext)
      ? ext
      : "png";
  }

  // ================== GUARDAR AJUSTES ==================

  async function handleSave() {
    setIsSaving(true);
    setProgress(0);
    try {
      let finalLogoUrl = logoUrlInput.trim();

      // Si el usuario subió un archivo, ese tiene prioridad
      if (logoFile) {
        const ext = guessExt(logoFile);
        // nombre único para evitar caché
        const storagePath = `logos/restaurant-logo-${Date.now()}.${ext}`;
        const storageRef = ref(storage, storagePath);

        const metadata = { contentType: logoFile.type || `image/${ext}` };

        // Upload con progreso (más confiable que uploadBytes)
        await new Promise<string>((resolve, reject) => {
          const task: UploadTask = uploadBytesResumable(storageRef, logoFile, metadata);

          task.on(
            "state_changed",
            (snap) => {
              const pct = (snap.bytesTransferred / snap.totalBytes) * 100;
              setProgress(Math.round(pct));
            },
            (err) => reject(err),
            async () => resolve(await getDownloadURL(task.snapshot.ref))
          );
        }).then((url) => {
          finalLogoUrl = url;
        });
      }

      await saveRestaurantSettings({
        name: name.trim(),
        currency: (currency || "ARS").trim(),
        logoUrl: finalLogoUrl,
      });

      if (mountedRef.current) {
        // Actualizo estados locales
        setLogoUrlInput(finalLogoUrl);
        setLogoPreview(finalLogoUrl || logoPreview);
        setLogoFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";

        toast({
          title: "Ajustes guardados",
          description: "Los cambios del restaurante se guardaron correctamente.",
        });
      }
    } catch (e: any) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          e?.message ??
          "No se pudieron guardar los ajustes. Revisá la conexión o los permisos de Firebase Storage.",
      });
    } finally {
      if (mountedRef.current) setIsSaving(false);
    }
  }

  // ================== PUBLICAR MENÚ (igual que tenías) ==================

  const handlePublish = () => {
    toast({
      title: "¡Menú Publicado!",
      description: "Los cambios en tu menú ahora son visibles para los clientes.",
    });
  };

  // ================== RENDER ==================

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Ajustes del Restaurante</h1>
        <p className="text-muted-foreground">
          Configurá los detalles de tu restaurante y publicá tu menú.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* -------- Detalles del restaurante -------- */}
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
                {/* Nombre */}
                <div className="space-y-2">
                  <Label htmlFor="restaurant-name">
                    <Landmark className="inline-block mr-2 h-4 w-4" />
                    Nombre del Restaurante
                  </Label>
                  <Input
                    id="restaurant-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                {/* Moneda */}
                <div className="space-y-2">
                  <Label htmlFor="currency">
                    <Wallet className="inline-block mr-2 h-4 w-4" />
                    Moneda
                  </Label>
                  <Input
                    id="currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                  />
                </div>

                {/* Logo archivo */}
                <div className="space-y-2">
                  <Label htmlFor="logo-file">
                    <Upload className="inline-block mr-2 h-4 w-4" />
                    Logo del Restaurante (archivo)
                  </Label>
                  <Input
                    id="logo-file"
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleLogoFileChange}
                  />
                  {progress > 0 && isSaving && (
                    <p className="text-xs text-muted-foreground">{`Subiendo… ${progress}%`}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Si subís un archivo, se usará en lugar de la URL.
                  </p>
                </div>

                {/* Logo URL */}
                <div className="space-y-2">
                  <Label htmlFor="logo-url">
                    <ImageIcon className="inline-block mr-2 h-4 w-4" />
                    URL del Logo (opcional)
                  </Label>
                  <Input
                    id="logo-url"
                    placeholder="https://tu-sitio.com/logo.png"
                    value={logoUrlInput}
                    onChange={(e) => {
                      setLogoUrlInput(e.target.value);
                      if (!logoFile) setLogoPreview(e.target.value || null);
                    }}
                  />
                </div>

                {/* Vista previa */}
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

        {/* -------- Publicar Menú -------- */}
        <Card>
          <CardHeader>
            <CardTitle>Publicar Menú</CardTitle>
            <CardDescription>
              Hacé que los cambios en tu menú sean visibles para todos tus clientes con un solo click.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Al publicar, se actualizará la versión del menú que ven tus clientes.
            </p>
            <Button variant="default" size="lg" onClick={handlePublish}>
              Publicar Menú Ahora
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

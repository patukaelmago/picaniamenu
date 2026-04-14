"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
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
import { db, storage } from "@/lib/firebase";
import {
  getRestaurantSettings,
  saveRestaurantSettings,
} from "@/lib/settings-service";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  type UploadTask,
} from "firebase/storage";
import { ImagePlus, Trash2, Upload } from "lucide-react";

const MAX_CAROUSEL_IMAGES = 6;
const DEFAULT_TENANT_LOGO = "/img/carta-online-logo-default.png";

type CarouselDraft = {
  id: string;
  file: File;
  previewUrl: string;
};

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
  const [logoPreview, setLogoPreview] = useState<string>(DEFAULT_TENANT_LOGO);

  const [carouselImages, setCarouselImages] = useState<string[]>([]);
  const [carouselDrafts, setCarouselDrafts] = useState<CarouselDraft[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const carouselInputRef = useRef<HTMLInputElement | null>(null);

  const totalCarouselCount = carouselImages.length + carouselDrafts.length;
  const remainingSlots = MAX_CAROUSEL_IMAGES - totalCarouselCount;

  const visibleCarouselPreviews = useMemo(
    () => [
      ...carouselImages.map((url) => ({ type: "saved" as const, url })),
      ...carouselDrafts.map((draft) => ({
        type: "draft" as const,
        id: draft.id,
        url: draft.previewUrl,
      })),
    ],
    [carouselImages, carouselDrafts]
  );

  useEffect(() => {
    const load = async () => {
      try {
        const settings = await getRestaurantSettings(tenantId);

        setName(settings.name || tenantId);
        setCurrency(settings.currency || "ARS");

        const initialLogo = settings.logoUrl?.trim() || DEFAULT_TENANT_LOGO;
        setLogoUrlInput(settings.logoUrl?.trim() || "");
        setLogoPreview(initialLogo);

        const uiRef = doc(db, "tenants", tenantId, "settings", "ui");
        const uiSnap = await getDoc(uiRef);

        if (uiSnap.exists()) {
          const data = uiSnap.data();
          const images = Array.isArray(data?.carouselImages)
            ? data.carouselImages.filter(
                (img: unknown): img is string =>
                  typeof img === "string" && img.trim() !== ""
              )
            : [];

          setCarouselImages(images.slice(0, MAX_CAROUSEL_IMAGES));
        } else {
          setCarouselImages([]);
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

    return () => {
      setCarouselDrafts((prev) => {
        prev.forEach((draft) => URL.revokeObjectURL(draft.previewUrl));
        return [];
      });
    };
  }, [tenantId]);

  function handleLogoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setLogoFile(file);

    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setLogoPreview(objectUrl);
    } else {
      setLogoPreview(logoUrlInput.trim() || DEFAULT_TENANT_LOGO);
    }
  }

  function handleLogoUrlChange(value: string) {
    setLogoUrlInput(value);
    if (!logoFile) {
      setLogoPreview(value.trim() || DEFAULT_TENANT_LOGO);
    }
  }

  function handleCarouselFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);

    if (!files.length) return;

    if (remainingSlots <= 0) {
      toast({
        variant: "destructive",
        title: "Límite alcanzado",
        description: `Solo podés cargar hasta ${MAX_CAROUSEL_IMAGES} imágenes.`,
      });
      if (carouselInputRef.current) carouselInputRef.current.value = "";
      return;
    }

    const selected = files.slice(0, remainingSlots);

    if (files.length > remainingSlots) {
      toast({
        title: "Se cargaron parcialmente",
        description: `Solo se agregaron ${remainingSlots} imágenes porque el máximo es ${MAX_CAROUSEL_IMAGES}.`,
      });
    }

    const drafts: CarouselDraft[] = selected.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setCarouselDrafts((prev) => [...prev, ...drafts]);

    if (carouselInputRef.current) carouselInputRef.current.value = "";
  }

  function removeSavedCarouselImage(index: number) {
    setCarouselImages((prev) => prev.filter((_, i) => i !== index));
  }

  function removeDraftCarouselImage(id: string) {
    setCarouselDrafts((prev) => {
      const found = prev.find((d) => d.id === id);
      if (found) URL.revokeObjectURL(found.previewUrl);
      return prev.filter((d) => d.id !== id);
    });
  }

  async function uploadFile(file: File, path: string) {
    const storageReference = ref(storage, path);
    const task: UploadTask = uploadBytesResumable(storageReference, file);

    return await new Promise<string>((resolve, reject) => {
      task.on(
        "state_changed",
        (snap) => {
          if (snap.totalBytes > 0) {
            setProgress(
              Math.round((snap.bytesTransferred / snap.totalBytes) * 100)
            );
          }
        },
        (err) => reject(err),
        async () => resolve(await getDownloadURL(task.snapshot.ref))
      );
    });
  }

  async function handleSave() {
    setIsSaving(true);
    setProgress(0);

    try {
      let finalLogoUrl = logoUrlInput.trim() || DEFAULT_TENANT_LOGO;

      if (logoFile) {
        const ext = logoFile.name.split(".").pop() || "png";
        finalLogoUrl = await uploadFile(
          logoFile,
          `tenants/${tenantId}/logos/logo-${Date.now()}.${ext}`
        );
      }

      const uploadedCarouselUrls: string[] = [];

      for (let i = 0; i < carouselDrafts.length; i++) {
        const draft = carouselDrafts[i];
        const ext = draft.file.name.split(".").pop() || "jpg";
        const url = await uploadFile(
          draft.file,
          `tenants/${tenantId}/carousel/carousel-${Date.now()}-${i}.${ext}`
        );
        uploadedCarouselUrls.push(url);
      }

      const finalCarouselImages = [
        ...carouselImages,
        ...uploadedCarouselUrls,
      ].slice(0, MAX_CAROUSEL_IMAGES);

      await saveRestaurantSettings(tenantId, {
        name: name.trim() || tenantId,
        currency: currency.trim() || "ARS",
        logoUrl: finalLogoUrl,
      });

      await setDoc(
        doc(db, "tenants", tenantId, "settings", "ui"),
        {
          carouselImages: finalCarouselImages,
        },
        { merge: true }
      );

      carouselDrafts.forEach((draft) => URL.revokeObjectURL(draft.previewUrl));

      setLogoUrlInput(finalLogoUrl === DEFAULT_TENANT_LOGO ? "" : finalLogoUrl);
      setLogoPreview(finalLogoUrl);
      setLogoFile(null);
      setCarouselImages(finalCarouselImages);
      setCarouselDrafts([]);
      setProgress(0);

      if (fileInputRef.current) fileInputRef.current.value = "";
      if (carouselInputRef.current) carouselInputRef.current.value = "";

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

  if (isLoading) {
    return (
      <p className="p-8 text-center text-muted-foreground animate-pulse">
        Cargando ajustes...
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Ajustes del Cliente</h1>
        <p className="text-muted-foreground">Configuración para {tenantId}</p>
      </div>

      <div className="grid gap-8 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Identidad Visual</CardTitle>
            <CardDescription>
              Nombre y logo del tenant. Si no cargás logo, usa el de Carta Online.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="res-name">Nombre comercial</Label>
              <Input
                id="res-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo-file">Logo</Label>
              <Input
                id="logo-file"
                type="file"
                ref={fileInputRef}
                onChange={handleLogoFileChange}
                accept="image/png,image/webp,image/jpeg,image/svg+xml"
              />
              {progress > 0 && isSaving && (
                <p className="text-xs text-muted-foreground">
                  Subiendo: {progress}%
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo-url">Logo por URL (opcional)</Label>
              <Input
                id="logo-url"
                value={logoUrlInput}
                onChange={(e) => handleLogoUrlChange(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label>Vista previa</Label>
              <div className="flex h-28 items-center justify-center rounded-md border bg-muted/30 p-4 overflow-hidden">
                <img
                  src={logoPreview}
                  alt="Preview logo"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Carrusel</CardTitle>
            <CardDescription>
              Hasta {MAX_CAROUSEL_IMAGES} imágenes. Se pueden cargar varias de una vez.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="carousel-files">Imágenes del carrusel</Label>
              <Input
                id="carousel-files"
                type="file"
                ref={carouselInputRef}
                multiple
                accept="image/png,image/webp,image/jpeg"
                onChange={handleCarouselFilesChange}
                disabled={remainingSlots <= 0}
              />

              <p className="text-xs text-muted-foreground">
                {totalCarouselCount}/{MAX_CAROUSEL_IMAGES} cargadas
              </p>
            </div>

            {visibleCarouselPreviews.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {visibleCarouselPreviews.map((item, index) => (
                  <div
                    key={item.type === "saved" ? `${item.url}-${index}` : item.id}
                    className="space-y-2"
                  >
                    <div className="overflow-hidden rounded-md border bg-muted/30 aspect-[16/10]">
                      <img
                        src={item.url}
                        alt={`Carousel ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        if (item.type === "saved") {
                          removeSavedCarouselImage(index);
                        } else {
                          removeDraftCarouselImage(item.id);
                        }
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Quitar
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex min-h-40 flex-col items-center justify-center rounded-md border border-dashed bg-muted/20 text-muted-foreground">
                <ImagePlus className="mb-2 h-8 w-8 opacity-60" />
                <p className="text-sm">Todavía no hay imágenes en el carrusel.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-start">
        <Button onClick={handleSave} disabled={isSaving}>
          <Upload className="mr-2 h-4 w-4" />
          {isSaving ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </div>
  );
}
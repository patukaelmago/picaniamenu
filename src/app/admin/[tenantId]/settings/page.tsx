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
import { Switch } from "@/components/ui/switch";
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
import { GripVertical, ImagePlus, Trash2, Upload } from "lucide-react";

const MAX_CAROUSEL_IMAGES = 10;
const DEFAULT_TENANT_LOGO = "/img/carta-online-logo-default.png";

type CarouselItem =
  | { kind: "saved"; id: string; url: string }
  | { kind: "draft"; id: string; file: File; previewUrl: string };

type RestaurantSettingsExtra = {
  name?: string;
  currency?: string;
  logoUrl?: string;
  showLogo?: boolean;
  showName?: boolean;
};

export default function TenantSettingsPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = use(params);

  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("ARS");

  const [showLogo, setShowLogo] = useState(true);
  const [showName, setShowName] = useState(true);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrlInput, setLogoUrlInput] = useState("");
  const [logoPreview, setLogoPreview] = useState<string>(DEFAULT_TENANT_LOGO);

  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState<number>(0);

  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const carouselInputRef = useRef<HTMLInputElement | null>(null);

  const totalCarouselCount = carouselItems.length;
  const remainingSlots = MAX_CAROUSEL_IMAGES - totalCarouselCount;

  useEffect(() => {
    const load = async () => {
      try {
        const settings = (await getRestaurantSettings(
          tenantId
        )) as RestaurantSettingsExtra;

        setName(settings.name || tenantId);
        setCurrency(settings.currency || "ARS");
        setShowLogo(settings.showLogo ?? true);
        setShowName(settings.showName ?? true);

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

          setCarouselItems(
            images.slice(0, MAX_CAROUSEL_IMAGES).map((url, index) => ({
              kind: "saved" as const,
              id: `saved-${index}-${url}`,
              url,
            }))
          );
        } else {
          setCarouselItems([]);
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
      setCarouselItems((prev) => {
        prev.forEach((item) => {
          if (item.kind === "draft") {
            URL.revokeObjectURL(item.previewUrl);
          }
        });
        return prev;
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

    const drafts: CarouselItem[] = selected.map((file) => ({
      kind: "draft",
      id: `draft-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setCarouselItems((prev) => [...prev, ...drafts]);

    if (carouselInputRef.current) carouselInputRef.current.value = "";
  }

  function removeCarouselItem(id: string) {
    setCarouselItems((prev) => {
      const found = prev.find((item) => item.id === id);
      if (found?.kind === "draft") {
        URL.revokeObjectURL(found.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  }

  function moveCarouselItem(fromId: string, toId: string) {
    setCarouselItems((prev) => {
      const fromIndex = prev.findIndex((item) => item.id === fromId);
      const toIndex = prev.findIndex((item) => item.id === toId);

      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
        return prev;
      }

      const copy = [...prev];
      const [moved] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, moved);
      return copy;
    });
  }

  async function uploadFile(file: File, path: string): Promise<string> {
    const storageReference = ref(storage, path);
    const task: UploadTask = uploadBytesResumable(storageReference, file);

    return new Promise<string>((resolve, reject) => {
      task.on(
        "state_changed",
        (snap) => {
          if (snap.totalBytes > 0) {
            setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
          }
        },
        (error) => {
          reject(error);
        },
        async () => {
          try {
            const url = await getDownloadURL(task.snapshot.ref);
            resolve(url);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  }

  async function handleSave() {
    if (isSaving) return;

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

      const finalCarouselImages: string[] = [];

      for (let i = 0; i < carouselItems.length; i++) {
        const item = carouselItems[i];

        if (item.kind === "saved") {
          finalCarouselImages.push(item.url);
          continue;
        }

        const ext = item.file.name.split(".").pop() || "jpg";
        const url = await uploadFile(
          item.file,
          `tenants/${tenantId}/carousel/carousel-${Date.now()}-${i}.${ext}`
        );

        finalCarouselImages.push(url);
      }

      await saveRestaurantSettings(tenantId, {
        name: name.trim() || tenantId,
        currency: currency.trim() || "ARS",
        logoUrl: finalLogoUrl === DEFAULT_TENANT_LOGO ? "" : finalLogoUrl,
        showLogo,
        showName,
      } as RestaurantSettingsExtra);

      await setDoc(
        doc(db, "tenants", tenantId, "settings", "ui"),
        {
          carouselImages: finalCarouselImages.slice(0, MAX_CAROUSEL_IMAGES),
        },
        { merge: true }
      );

      carouselItems.forEach((item) => {
        if (item.kind === "draft") {
          URL.revokeObjectURL(item.previewUrl);
        }
      });

      setLogoUrlInput(finalLogoUrl === DEFAULT_TENANT_LOGO ? "" : finalLogoUrl);
      setLogoPreview(finalLogoUrl);
      setLogoFile(null);
      setCarouselItems(
        finalCarouselImages.slice(0, MAX_CAROUSEL_IMAGES).map((url, index) => ({
          kind: "saved" as const,
          id: `saved-${index}-${url}`,
          url,
        }))
      );
      setProgress(0);
      setDraggedId(null);
      setDragOverId(null);

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

  const previewItems = useMemo(
    () =>
      carouselItems.map((item) => ({
        id: item.id,
        url: item.kind === "saved" ? item.url : item.previewUrl,
        kind: item.kind,
      })),
    [carouselItems]
  );

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

            <div className="flex items-center justify-between rounded-md border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="show-logo">Mostrar logo</Label>
                <p className="text-sm text-muted-foreground">
                  Muestra u oculta la imagen del logo en el navbar.
                </p>
              </div>
              <Switch
                id="show-logo"
                checked={showLogo}
                onCheckedChange={setShowLogo}
              />
            </div>

            <div className="flex items-center justify-between rounded-md border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="show-name">Mostrar nombre</Label>
                <p className="text-sm text-muted-foreground">
                  Muestra u oculta el texto junto al logo en el navbar.
                </p>
              </div>
              <Switch
                id="show-name"
                checked={showName}
                onCheckedChange={setShowName}
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
              <div className="flex h-24 items-center justify-center rounded-md border bg-muted/30 p-4 overflow-hidden">
                {showLogo ? (
                  <img
                    src={logoPreview}
                    alt="Preview logo"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <span className="text-sm text-muted-foreground">
                    Logo oculto
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Carrusel</CardTitle>
            <CardDescription>
              Hasta {MAX_CAROUSEL_IMAGES} imágenes. Podés cargar varias y arrastrarlas para ordenar.
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

            {previewItems.length > 0 ? (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {previewItems.map((item, index) => {
                  const isDragging = draggedId === item.id;
                  const isDragOver = dragOverId === item.id && draggedId !== item.id;

                  return (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={() => {
                        setDraggedId(item.id);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverId(item.id);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggedId && draggedId !== item.id) {
                          moveCarouselItem(draggedId, item.id);
                        }
                        setDraggedId(null);
                        setDragOverId(null);
                      }}
                      onDragEnd={() => {
                        setDraggedId(null);
                        setDragOverId(null);
                      }}
                      className={[
                        "rounded-md border bg-background p-2 transition-all",
                        isDragging ? "opacity-50" : "opacity-100",
                        isDragOver ? "ring-2 ring-primary" : "",
                      ].join(" ")}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <GripVertical className="h-3.5 w-3.5" />
                          {index + 1}
                        </div>
                      </div>

                      <div className="overflow-hidden rounded-md border bg-muted/30 aspect-square">
                        <img
                          src={item.url}
                          alt={`Carousel ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        className="w-full text-xs py-1 h-auto mt-2"
                        onClick={() => removeCarouselItem(item.id)}
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        Quitar
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex min-h-32 flex-col items-center justify-center rounded-md border border-dashed bg-muted/20 text-muted-foreground">
                <ImagePlus className="mb-2 h-7 w-7 opacity-60" />
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
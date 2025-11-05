"use client";

import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  PlusCircle,
  Pencil,
  Trash2,
  GripVertical,
  Loader2,
} from "lucide-react";
import { CATEGORIES } from "@/lib/data";
import type { Category, MenuItem, MenuItemInput } from "@/lib/types";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { generateSearchKeywords } from "@/ai/flows/generate-search-keywords";
import { useToast } from "@/hooks/use-toast";
import {
  listMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "@/lib/menu-service";

const formatCurrency = (price: number) => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(price);
};

const emptyItem: MenuItemInput = {
  name: "",
  description: "",
  price: 0,
  currency: "ARS",
  imageUrl: "",
  imageId: "",
  categoryId: "",
  isVisible: true,
  inStock: true,
  isSpecial: false,
  tags: [],
  allergens: [],
  searchKeywords: [],
  order: 0,
};

export default function AdminMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories] = useState<Category[]>(CATEGORIES);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MenuItemInput>(emptyItem);
  const { toast } = useToast();

  // Cargar platos desde Firestore al montar
  useEffect(() => {
    const load = async () => {
      try {
        const data = await listMenuItems();
        setItems(data);
      } catch (e) {
        console.error(e);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar los platos desde la base.",
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [toast]);

  const handleGenerateKeywords = async () => {
    setIsGenerating(true);
    try {
      const keywords = await generateSearchKeywords({
        name: form.name || "Bife de Chorizo",
        tags: ["carne", "parrilla"],
        category: "Parrilla",
      });
      setForm((prev) => ({
        ...prev,
        searchKeywords: keywords.searchKeywords,
      }));
      toast({
        title: "Keywords generadas",
        description: `Se generaron: ${keywords.searchKeywords.join(", ")}`,
      });
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron generar las keywords.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  function handleFormChange<K extends keyof MenuItemInput>(
    key: K,
    value: MenuItemInput[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSaveItem() {
    try {
      if (editingId) {
        await updateMenuItem(editingId, form);
        toast({ title: "Plato actualizado" });
      } else {
        await createMenuItem(form);
        toast({ title: "Plato creado" });
      }

      setForm(emptyItem);
      setEditingId(null);

      // Recargar desde Firestore
      const data = await listMenuItems();
      setItems(data);
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar el plato.",
      });
    }
  }

  function handleStartEdit(item: MenuItem) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description,
      price: item.price,
      currency: item.currency,
      imageUrl: item.imageUrl,
      imageId: item.imageId,
      categoryId: item.categoryId,
      isVisible: item.isVisible,
      inStock: item.inStock,
      isSpecial: item.isSpecial,
      tags: item.tags ?? [],
      allergens: item.allergens ?? [],
      searchKeywords: item.searchKeywords ?? [],
      order: item.order ?? 0,
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este plato?")) return;
    try {
      await deleteMenuItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast({ title: "Plato eliminado" });
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el plato.",
      });
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Gestionar Menú</h1>
        <p className="text-muted-foreground">
          Agregá, editá y organizá las categorías y platos de tu restaurante.
        </p>
      </div>

      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items">Items del Menú</TabsTrigger>
          <TabsTrigger value="categories">Categorías</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Platos y Bebidas</CardTitle>
              <CardDescription>
                Administrá todos los items de tu menú.
              </CardDescription>
              <div className="flex justify-end">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button>
                      <PlusCircle className="mr-2 h-4 w-4" />{" "}
                      {editingId ? "Editar Item" : "Agregar Item"}
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="sm:max-w-lg overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>
                        {editingId ? "Editar Item" : "Agregar Nuevo Item"}
                      </SheetTitle>
                      <SheetDescription>
                        Completá los detalles del plato o bebida.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                          Nombre
                        </Label>
                        <Input
                          id="name"
                          className="col-span-3"
                          value={form.name}
                          onChange={(e) =>
                            handleFormChange("name", e.target.value)
                          }
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label
                          htmlFor="description"
                          className="text-right"
                        >
                          Descripción
                        </Label>
                        <Textarea
                          id="description"
                          className="col-span-3"
                          value={form.description}
                          onChange={(e) =>
                            handleFormChange(
                              "description",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="price" className="text-right">
                          Precio (ARS)
                        </Label>
                        <Input
                          id="price"
                          type="number"
                          className="col-span-3"
                          value={form.price}
                          onChange={(e) =>
                            handleFormChange(
                              "price",
                              Number(e.target.value)
                            )
                          }
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="categoryId" className="text-right">
                          Categoría
                        </Label>

                        {/* usamos un select nativo para elegir la categoría por id */}
                        <select
                          id="categoryId"
                          className="col-span-3 h-9 rounded-md border bg-background px-2 text-sm"
                          value={form.categoryId}
                          onChange={(e) => handleFormChange("categoryId", e.target.value)}
                        >
                          <option value="">Elegí una categoría…</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="imageId" className="text-right">
                          Imagen ID
                        </Label>
                        <Input
                          id="imageId"
                          className="col-span-3"
                          value={form.imageId}
                          onChange={(e) =>
                            handleFormChange("imageId", e.target.value)
                          }
                        />
                      </div>

                      <Button
                        onClick={handleGenerateKeywords}
                        disabled={isGenerating}
                      >
                        {isGenerating && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Generar Keywords con IA
                      </Button>
                    </div>
                    <SheetFooter>
                      <SheetClose asChild>
                        <Button type="button" onClick={handleSaveItem}>
                          Guardar Cambios
                        </Button>
                      </SheetClose>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Cargando platos...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Imagen</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>En Stock</TableHead>
                      <TableHead>Visible</TableHead>
                      <TableHead>Especial</TableHead>
                      <TableHead className="w-[100px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => {
                      const category = categories.find(
                        (c) => c.id === item.categoryId
                      );
                      const image = PlaceHolderImages.find(
                        (p) => p.id === item.imageId
                      );
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            {image && (
                              <Image
                                src={image.imageUrl}
                                alt={item.name}
                                width={50}
                                height={50}
                                className="rounded-md object-cover"
                                data-ai-hint={image.imageHint}
                              />
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            {item.name}
                          </TableCell>
                          <TableCell>{category?.name}</TableCell>
                          <TableCell>
                            {formatCurrency(item.price)}
                          </TableCell>
                          <TableCell>
                            <Switch checked={item.inStock} disabled />
                          </TableCell>
                          <TableCell>
                            <Switch checked={item.isVisible} disabled />
                          </TableCell>
                          <TableCell>
                            <Switch checked={item.isSpecial} disabled />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleStartEdit(item)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => handleDelete(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Categorías del Menú</CardTitle>
              <CardDescription>
                Organizá las secciones de tu menú. (Por ahora usa CATEGORIES
                estático)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {categories
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-3 bg-secondary rounded-md"
                    >
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                        <span className="font-medium">
                          {category.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center space-x-2">
                          <Label
                            htmlFor={`visible-${category.id}`}
                            className="text-sm"
                          >
                            Visible
                          </Label>
                          <Switch
                            id={`visible-${category.id}`}
                            checked={category.isVisible}
                            disabled
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" disabled>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            disabled
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


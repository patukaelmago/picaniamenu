"use client";

import { use, useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { notFound } from "next/navigation";
import { Pencil, Trash2, PlusCircle } from "lucide-react";

import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";

type FridayMenuData = {
  entrada: string;
  postre: string;
};

type Category = {
  id: string;
  name: string;
  parentCategoryId: string | null;
  order: number;
};

type LunchItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  imageUrl: string;
  imageId: string;
  categoryId: string;
  isVisible: boolean;
  inStock: boolean;
  isSpecial: boolean;
  tags: string[];
  allergens: string[];
  searchKeywords: string[];
  order: number;
};

const formatCurrency = (price: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);

function norm(s: string) {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export default function TenantAlmuerzoPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = use(params);

  const [data, setData] = useState<FridayMenuData>({ entrada: "", postre: "" });
  const [tenantName, setTenantName] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<LunchItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<LunchItem>>({});

  if (tenantId.toLowerCase() !== "picana") {
    return notFound();
  }

  const categoryById = useMemo(() => {
    const m = new Map<string, Category>();
    categories.forEach((c) => m.set(c.id, c));
    return m;
  }, [categories]);

  const lunchParent = useMemo(
    () =>
      categories.find(
        (c) =>
          !c.parentCategoryId &&
          (norm(c.name) === "almuerzo ejecutivo" || norm(c.name) === "menu viernes")
      ),
    [categories]
  );

  const principalesCategory = useMemo(() => {
    if (!lunchParent) return null;

    return categories.find(
      (c) =>
        c.parentCategoryId === lunchParent.id &&
        (norm(c.name) === "principales" || norm(c.name) === "principal")
    );
  }, [categories, lunchParent]);

  const categoryOptions = useMemo(() => {
    if (!lunchParent) return [];

    return categories
      .filter((c) => c.id === lunchParent.id || c.parentCategoryId === lunchParent.id)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [categories, lunchParent]);

  function getItemParentId(item: LunchItem) {
    const cat = categoryById.get(item.categoryId);
    if (!cat) return null;
    return cat.parentCategoryId ?? cat.id;
  }

  const lunchItems = useMemo(() => {
    const hiddenFixedItems = ["bebida", "entrada", "postre"];

    return items
      .filter((item) => getItemParentId(item) === lunchParent?.id)
      .filter((item) => !hiddenFixedItems.includes(norm(item.name)))
      .sort((a, b) => {
        const oa = a.order ?? 0;
        const ob = b.order ?? 0;
        if (oa !== ob) return oa - ob;
        return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
      });
  }, [items, lunchParent, categoryById]);

  async function loadAll() {
    const tenantRef = doc(db, "tenants", tenantId);
    const tenantSnap = await getDoc(tenantRef);

    if (tenantSnap.exists()) {
      const tenantData: any = tenantSnap.data();
      setTenantName(
        tenantData?.brandName ||
          tenantData?.commercialName ||
          tenantData?.businessName ||
          tenantData?.displayName ||
          tenantData?.name ||
          tenantId
      );
    } else {
      setTenantName(tenantId);
    }

    const menuRef = doc(db, "tenants", tenantId, "special_menus", "friday");
    const menuSnap = await getDoc(menuRef);

    if (menuSnap.exists()) {
      setData(menuSnap.data() as FridayMenuData);
    } else {
      const legacyRef = doc(db, "menu_viernes", "data");
      const legacySnap = await getDoc(legacyRef);

      if (legacySnap.exists()) {
        setData({
          entrada: legacySnap.data().entrada ?? "",
          postre: legacySnap.data().postre ?? "",
        });
      }
    }

    const catsSnap = await getDocs(
      query(collection(db, "tenants", tenantId, "categories"), orderBy("order", "asc"))
    );

    setCategories(
      catsSnap.docs.map((d) => {
        const raw: any = d.data();

        return {
          id: d.id,
          name: raw.name ?? "",
          parentCategoryId: raw.parentCategoryId ?? null,
          order: Number(raw.order ?? 0),
        };
      })
    );

    const itemsSnap = await getDocs(
      query(collection(db, "tenants", tenantId, "menuItems"), orderBy("order", "asc"))
    );

    setItems(
      itemsSnap.docs.map((d) => {
        const raw: any = d.data();

        return {
          id: d.id,
          name: raw.name ?? "",
          description: raw.description ?? "",
          price: Number(raw.price ?? 0),
          currency: raw.currency ?? "ARS",
          imageUrl: raw.imageUrl ?? "",
          imageId: raw.imageId ?? "",
          categoryId: raw.categoryId ?? "",
          isVisible: raw.isVisible ?? true,
          inStock: raw.inStock ?? true,
          isSpecial: raw.isSpecial ?? false,
          tags: raw.tags ?? [],
          allergens: raw.allergens ?? [],
          searchKeywords: raw.searchKeywords ?? [],
          order: Number(raw.order ?? 0),
        };
      })
    );
  }

  useEffect(() => {
    const run = async () => {
      try {
        await loadAll();
      } catch (e) {
        console.error(e);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo cargar la configuración.",
        });
      } finally {
        setLoading(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  async function autosaveFridayMenu(nextData: FridayMenuData) {
    try {
      const ref = doc(db, "tenants", tenantId, "special_menus", "friday");
      await setDoc(ref, nextData, { merge: true });

      toast({
        title: "Guardado automático",
        description: "Entrada y postre actualizados.",
      });
    } catch (e) {
      console.error(e);

      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar entrada y postre.",
      });
    }
  }

  async function handleToggleItem(id: string, value: boolean) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isVisible: value } : item))
    );

    try {
      await updateDoc(doc(db, "tenants", tenantId, "menuItems", id), {
        isVisible: value,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error(e);

      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isVisible: !value } : item))
      );

      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el item.",
      });
    }
  }

  function handleStartEdit(item: LunchItem) {
    setEditId(item.id);
    setEditForm({
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
    setEditOpen(true);
  }

  async function handleUpdateItem() {
    if (!editId) return;

    try {
      await updateDoc(doc(db, "tenants", tenantId, "menuItems", editId), {
        name: editForm.name ?? "",
        description: editForm.description ?? "",
        price: Number(editForm.price ?? 0),
        currency: editForm.currency ?? "ARS",
        imageUrl: editForm.imageUrl ?? "",
        imageId: editForm.imageId ?? "",
        categoryId: editForm.categoryId ?? "",
        isVisible: editForm.isVisible ?? true,
        inStock: editForm.inStock ?? true,
        isSpecial: editForm.isSpecial ?? false,
        tags: editForm.tags ?? [],
        allergens: editForm.allergens ?? [],
        searchKeywords: editForm.searchKeywords ?? [],
        order: Number(editForm.order ?? 0),
        updatedAt: serverTimestamp(),
      });

      setItems((prev) =>
        prev.map((i) =>
          i.id === editId
            ? {
                ...i,
                name: editForm.name ?? "",
                description: editForm.description ?? "",
                price: Number(editForm.price ?? 0),
                currency: editForm.currency ?? "ARS",
                imageUrl: editForm.imageUrl ?? "",
                imageId: editForm.imageId ?? "",
                categoryId: editForm.categoryId ?? "",
                isVisible: editForm.isVisible ?? true,
                inStock: editForm.inStock ?? true,
                isSpecial: editForm.isSpecial ?? false,
                tags: editForm.tags ?? [],
                allergens: editForm.allergens ?? [],
                searchKeywords: editForm.searchKeywords ?? [],
                order: Number(editForm.order ?? 0),
              }
            : i
        )
      );

      setEditOpen(false);
      setEditId(null);
      setEditForm({});

      toast({ title: "Item actualizado" });
    } catch (e) {
      console.error(e);

      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el item.",
      });
    }
  }

  async function handleDeleteItem(id: string) {
    if (!confirm("¿Eliminar este item del almuerzo?")) return;

    try {
      await deleteDoc(doc(db, "tenants", tenantId, "menuItems", id));
      setItems((prev) => prev.filter((item) => item.id !== id));
      toast({ title: "Item eliminado" });
    } catch (e) {
      console.error(e);

      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el item.",
      });
    }
  }

  async function handleCreateItem() {
    if (!principalesCategory) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se encontró la categoría Principales dentro de Almuerzo Ejecutivo.",
      });
      return;
    }

    const name = newItemName.trim();
    if (!name) return;

    try {
      const nextOrder =
        lunchItems.length === 0
          ? 0
          : Math.max(...lunchItems.map((item) => item.order ?? 0)) + 1;

      const ref = await addDoc(collection(db, "tenants", tenantId, "menuItems"), {
        name,
        description: "",
        price: Number(newItemPrice) || 0,
        currency: "ARS",
        imageUrl: "",
        imageId: "",
        categoryId: principalesCategory.id,
        isVisible: true,
        inStock: true,
        isSpecial: false,
        tags: [],
        allergens: [],
        searchKeywords: [],
        order: nextOrder,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setItems((prev) => [
        ...prev,
        {
          id: ref.id,
          name,
          description: "",
          price: Number(newItemPrice) || 0,
          currency: "ARS",
          imageUrl: "",
          imageId: "",
          categoryId: principalesCategory.id,
          isVisible: true,
          inStock: true,
          isSpecial: false,
          tags: [],
          allergens: [],
          searchKeywords: [],
          order: nextOrder,
        },
      ]);

      setNewItemName("");
      setNewItemPrice("");

      toast({ title: "Item creado" });
    } catch (e) {
      console.error(e);

      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear el item.",
      });
    }
  }

  if (loading) {
    return (
      <p className="p-8 text-center text-muted-foreground animate-pulse">
        Cargando configuración...
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <div>
      <h1 className="text-3xl font-bold font-headline text-[hsl(var(--nav-text))]">
          Configuración de Almuerzo
        </h1>
        <p className="text-muted-foreground">
          Gestión para los jueves y viernes para {tenantName || tenantId}
        </p>
      </div>

      <div className="grid gap-6 max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>Almuerzo Jueves y Viernes</CardTitle>
            <CardDescription>
              Entrada y postre se guardan automáticamente al salir del campo.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Entrada del Día</Label>
              <Input
                value={data.entrada}
                onChange={(e) => setData({ ...data, entrada: e.target.value })}
                onBlur={() => autosaveFridayMenu(data)}
                placeholder="Ej: Focaccia con hummus..."
              />
            </div>

            <div className="space-y-2">
              <Label>Postre o Café</Label>
              <Input
                value={data.postre}
                onChange={(e) => setData({ ...data, postre: e.target.value })}
                onBlur={() => autosaveFridayMenu(data)}
                placeholder="Ej: Flan casero..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Items del Almuerzo</CardTitle>
            <CardDescription>
              Administrá los platos principales del almuerzo ejecutivo.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="grid gap-2 flex-1">
                <Label>Nombre</Label>
                <Input
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Ej: Milanesa con puré"
                />
              </div>

              <div className="grid gap-2 sm:w-40">
                <Label>Precio</Label>
                <Input
                  type="number"
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(e.target.value)}
                  placeholder="22000"
                />
              </div>

              <Button onClick={handleCreateItem} className="bg-black hover:bg-black/90">
                <PlusCircle className="mr-2 h-4 w-4" />
                Agregar
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Visible</TableHead>
                  <TableHead className="w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {lunchItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{formatCurrency(item.price)}</TableCell>
                    <TableCell>
                      <Switch
                        checked={!!item.isVisible}
                        onCheckedChange={(v) => handleToggleItem(item.id, v)}
                      />
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
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {lunchItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground">
                      No hay items cargados para el almuerzo ejecutivo.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Editar Item</SheetTitle>
            <SheetDescription>Actualizá los datos del plato.</SheetDescription>
          </SheetHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="e-name" className="text-right">
                Nombre
              </Label>
              <Input
                id="e-name"
                className="col-span-3"
                value={editForm.name ?? ""}
                onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="e-description" className="text-right">
                Descripción
              </Label>
              <Textarea
                id="e-description"
                className="col-span-3"
                value={editForm.description ?? ""}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, description: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="e-price" className="text-right">
                Precio (ARS)
              </Label>
              <Input
                id="e-price"
                type="number"
                className="col-span-3"
                value={editForm.price ?? 0}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, price: Number(e.target.value) }))
                }
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="e-category" className="text-right">
                Categoría
              </Label>
              <select
                id="e-category"
                className="col-span-3 h-9 rounded-md border bg-background px-2 text-sm"
                value={editForm.categoryId ?? ""}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, categoryId: e.target.value }))
                }
              >
                <option value="">Elegí una categoría…</option>
                {categoryOptions.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.parentCategoryId ? `↳ ${cat.name}` : cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
  <Label htmlFor="e-imageId" className="text-right">
    Imagen ID
  </Label>
  <Input
    id="e-imageId"
    className="col-span-3"
    value={editForm.imageId ?? ""}
    onChange={(e) =>
      setEditForm((p) => ({ ...p, imageId: e.target.value }))
    }
  />
</div>

<div className="grid grid-cols-4 items-center gap-4">
  <Label className="text-right">
    Sugerencia
  </Label>
  <div className="col-span-3">
    <Switch
      checked={!!editForm.isSpecial}
      onCheckedChange={(v) =>
        setEditForm((p) => ({ ...p, isSpecial: v }))
      }
    />
  </div>
</div>
          </div>

          <SheetFooter>
            <SheetClose asChild>
              <Button variant="secondary">Cancelar</Button>
            </SheetClose>

            <Button type="button" onClick={handleUpdateItem}>
              Guardar Cambios
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
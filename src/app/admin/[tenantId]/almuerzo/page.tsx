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
  price: number;
  categoryId: string;
  isVisible: boolean;
  isSpecial: boolean;
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
  const [saving, setSaving] = useState(false);

  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");

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
          (norm(c.name) === "almuerzo viernes" || norm(c.name) === "menu viernes")
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
          price: Number(raw.price ?? 0),
          categoryId: raw.categoryId ?? "",
          isVisible: raw.isVisible ?? true,
          isSpecial: raw.isSpecial ?? false,
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

  const handleSaveFridayMenu = async () => {
    setSaving(true);

    try {
      const ref = doc(db, "tenants", tenantId, "special_menus", "friday");
      await setDoc(ref, data, { merge: true });

      toast({
        title: "Menú guardado",
        description: "El menú de almuerzo se actualizó correctamente.",
      });
    } catch (e) {
      console.error(e);

      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar el menú.",
      });
    } finally {
      setSaving(false);
    }
  };

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

  async function handleUpdateItem(item: LunchItem) {
    const newName = prompt("Nombre del item", item.name);
    if (newName === null) return;

    const newPrice = prompt("Precio", String(item.price));
    if (newPrice === null) return;

    try {
      await updateDoc(doc(db, "tenants", tenantId, "menuItems", item.id), {
        name: newName.trim(),
        price: Number(newPrice) || 0,
        updatedAt: serverTimestamp(),
      });

      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, name: newName.trim(), price: Number(newPrice) || 0 }
            : i
        )
      );

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
        description: "No se encontró la categoría Principales dentro de Almuerzo Viernes.",
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
          price: Number(newItemPrice) || 0,
          categoryId: principalesCategory.id,
          isVisible: true,
          isSpecial: false,
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
        <h1 className="text-3xl font-bold font-headline text-[#1b3059]">
          Configuración de Almuerzo
        </h1>
        <p className="text-muted-foreground">
          Gestión del menú especial de los viernes para {tenantName || tenantId}
        </p>
      </div>

      <div className="grid gap-6 max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>Menú del Viernes</CardTitle>
            <CardDescription>
              Definí la entrada y el postre para este cliente.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Entrada del Día</Label>
              <Input
                value={data.entrada}
                onChange={(e) => setData({ ...data, entrada: e.target.value })}
                placeholder="Ej: Focaccia con hummus..."
              />
            </div>

            <div className="space-y-2">
              <Label>Postre o Café</Label>
              <Input
                value={data.postre}
                onChange={(e) => setData({ ...data, postre: e.target.value })}
                placeholder="Ej: Flan casero..."
              />
            </div>

            <Button
              onClick={handleSaveFridayMenu}
              disabled={saving}
              className="w-full bg-[#1b3059] hover:bg-[#1b3059]/90"
            >
              {saving ? "Guardando..." : "Guardar Menú"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Items del Almuerzo</CardTitle>
            <CardDescription>
              Administrá los platos principales del almuerzo viernes.
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
                          onClick={() => handleUpdateItem(item)}
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
                      No hay items cargados para el almuerzo viernes.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
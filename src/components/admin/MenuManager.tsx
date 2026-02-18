"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PlusCircle,
  Pencil,
  Trash2,
  GripVertical,
  Loader2,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
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

import type { Category, MenuItem, MenuItemInput } from "@/lib/types";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { generateSearchKeywords } from "@/ai/flows/generate-search-keywords";
import { useToast } from "@/hooks/use-toast";

type Props = { tenantId: string };

const formatCurrency = (price: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);

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

function arrayMove<T>(arr: T[], from: number, to: number) {
  const copy = arr.slice();
  const item = copy.splice(from, 1)[0];
  copy.splice(to, 0, item);
  return copy;
}

function norm(s: string) {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export default function MenuManager({ tenantId }: Props) {
  const { toast } = useToast();

  // ========= STATE =========
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // crear categoría
  const [formCatName, setFormCatName] = useState("");
  const [formCatParentId, setFormCatParentId] = useState<string>("");

  // expand/collapse padres
  const [openParents, setOpenParents] = useState<Record<string, boolean>>({});
  const toggleParent = (id: string) =>
    setOpenParents((p) => ({ ...p, [id]: !p[id] }));

  // filtro items por padre
  const [parentFilterId, setParentFilterId] = useState<string>("");

  // drag & drop padres
  const [dragRootIndex, setDragRootIndex] = useState<number | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  // editar categoría
  const [catEditingId, setCatEditingId] = useState<string | null>(null);
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [catForm, setCatForm] = useState<{
    name: string;
    order: number;
    isVisible: boolean;
    parentCategoryId: string | null;
  }>({ name: "", order: 0, isVisible: true, parentCategoryId: null });

  // crear item
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<MenuItemInput>(emptyItem);
  const [isGenerating, setIsGenerating] = useState(false);

  // editar item
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<MenuItemInput>(emptyItem);

  // orden items
  const [sortMode, setSortMode] = useState<"auto" | "manual">("manual");
  const [searchTerm, setSearchTerm] = useState("");
  const [dragItem, setDragItem] = useState<MenuItem | null>(null);
  const [isSavingItemsOrder, setIsSavingItemsOrder] = useState(false);

  // ========= FIRESTORE REFS =========
  const catsCol = useMemo(
    () => collection(db, "tenants", tenantId, "categories"),
    [tenantId]
  );
  const itemsCol = useMemo(
    () => collection(db, "tenants", tenantId, "menuItems"),
    [tenantId]
  );

  // ========= LOADERS =========
  async function loadCategories() {
    const q = query(catsCol, orderBy("order", "asc"));
    const snap = await getDocs(q);

    const data = snap.docs.map((d) => {
      const raw: any = d.data();
      const isVisible =
        typeof raw.isVisible === "boolean"
          ? raw.isVisible
          : typeof raw.active === "boolean"
          ? raw.active
          : true;

      return {
        id: d.id,
        name: raw.name ?? "",
        order: typeof raw.order === "number" ? raw.order : Number(raw.order) || 0,
        isVisible,
        parentCategoryId: raw.parentCategoryId ?? null,
      } as Category;
    });

    setCategories(data);

    setParentFilterId((prev) => {
      if (prev) return prev;
      const fridayParent = data.find(
        (c) =>
          !c.parentCategoryId &&
          (norm(c.name) === "almuerzo viernes" || norm(c.name) === "menu viernes")
      );
      return fridayParent?.id ?? "";
    });
  }

  async function loadItems() {
    const q = query(itemsCol, orderBy("order", "asc"));
    const snap = await getDocs(q);

    const data = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as any[];

    setItems(
      data.map(
        (x: any) =>
          ({
            id: x.id,
            name: x.name ?? "",
            description: x.description ?? "",
            price: Number(x.price ?? 0),
            currency: x.currency ?? "ARS",
            imageUrl: x.imageUrl ?? "",
            imageId: x.imageId ?? "",
            categoryId: x.categoryId ?? "",
            isVisible: x.isVisible ?? true,
            inStock: x.inStock ?? true,
            isSpecial: x.isSpecial ?? false,
            tags: x.tags ?? [],
            allergens: x.allergens ?? [],
            searchKeywords: x.searchKeywords ?? [],
            order: Number(x.order ?? 0),
          } as MenuItem)
      )
    );
  }

  async function reloadAll() {
    await Promise.all([loadCategories(), loadItems()]);
  }

  useEffect(() => {
    const run = async () => {
      try {
        await reloadAll();
      } catch (e) {
        console.error(e);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo cargar la data del tenant.",
        });
      } finally {
        setLoading(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  // ========= INDEXES =========
  const categoryById = useMemo(() => {
    const m = new Map<string, Category>();
    categories.forEach((c) => m.set(c.id, c));
    return m;
  }, [categories]);

  const rootCategories = useMemo(
    () => categories.filter((c) => !c.parentCategoryId),
    [categories]
  );

  const childrenByParent = useMemo(() => {
    const m = new Map<string, Category[]>();
    categories.forEach((c) => {
      if (!c.parentCategoryId) return;
      const arr = m.get(c.parentCategoryId) ?? [];
      arr.push(c);
      m.set(c.parentCategoryId, arr);
    });

    m.forEach((arr, key) => {
      m.set(
        key,
        arr.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      );
    });

    return m;
  }, [categories]);

  const sortedRootCategories = useMemo(
    () => rootCategories.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [rootCategories]
  );

  const categoryOptions = useMemo(() => {
    const options: Array<{
      id: string;
      label: string;
      isChild: boolean;
      parentId: string | null;
    }> = [];

    sortedRootCategories.forEach((parent) => {
      options.push({ id: parent.id, label: parent.name, isChild: false, parentId: null });

      const kids = childrenByParent.get(parent.id) ?? [];
      kids.forEach((child) => {
        options.push({
          id: child.id,
          label: `↳ ${child.name}`,
          isChild: true,
          parentId: parent.id,
        });
      });
    });

    return options;
  }, [sortedRootCategories, childrenByParent]);

  function getItemParentId(item: MenuItem): string | null {
    const cat = categoryById.get(item.categoryId);
    if (!cat) return null;
    return cat.parentCategoryId ?? cat.id;
  }

  // ========= FORM HELPERS =========
  function onChangeCreate<K extends keyof MenuItemInput>(key: K, value: MenuItemInput[K]) {
    setCreateForm((p) => ({ ...p, [key]: value }));
  }
  function onChangeEdit<K extends keyof MenuItemInput>(key: K, value: MenuItemInput[K]) {
    setEditForm((p) => ({ ...p, [key]: value }));
  }

  async function handleGenerateKeywords() {
    setIsGenerating(true);
    try {
      const keywords = await generateSearchKeywords({
        name: createOpen ? createForm.name || "Bife de Chorizo" : editForm.name || "Bife de Chorizo",
        tags: ["carne", "parrilla"],
        category: "Parrilla",
      });

      if (createOpen) {
        setCreateForm((prev) => ({ ...prev, searchKeywords: keywords.searchKeywords }));
      } else {
        setEditForm((prev) => ({ ...prev, searchKeywords: keywords.searchKeywords }));
      }

      toast({
        title: "Keywords generadas",
        description: `Se generaron: ${keywords.searchKeywords.join(", ")}`,
      });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Error", description: "No se pudieron generar las keywords." });
    } finally {
      setIsGenerating(false);
    }
  }

  // ========= ITEMS CRUD =========
  async function handleCreateItem() {
    try {
      await addDoc(itemsCol, {
        ...createForm,
        order: Number(createForm.order ?? 0),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Plato creado" });
      setCreateForm(emptyItem);
      setCreateOpen(false);
      await loadItems();
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Error", description: "No se pudo crear el plato." });
    }
  }

  function handleStartEdit(item: MenuItem) {
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
      await updateDoc(doc(itemsCol, editId), {
        ...editForm,
        order: Number(editForm.order ?? 0),
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Plato actualizado" });
      setEditOpen(false);
      setEditId(null);
      setEditForm(emptyItem);
      await loadItems();
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar el plato." });
    }
  }

  async function handleDeleteItem(id: string) {
    if (!confirm("¿Eliminar este plato?")) return;
    try {
      await deleteDoc(doc(itemsCol, id));
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast({ title: "Plato eliminado" });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar el plato." });
    }
  }

  async function handleToggleItem(
    id: string,
    field: "inStock" | "isVisible" | "isSpecial",
    value: boolean
  ) {
    setItems((prev) => prev.map((it) => (it.id === id ? ({ ...it, [field]: value } as MenuItem) : it)));
    try {
      await updateDoc(doc(itemsCol, id), { [field]: value, updatedAt: serverTimestamp() });
    } catch (e) {
      console.error(e);
      setItems((prev) => prev.map((it) => (it.id === id ? ({ ...it, [field]: !value } as MenuItem) : it)));
      toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar el estado del item." });
    }
  }

  // ========= CATEGORIES CRUD =========
  async function onCreateCategory() {
    const name = formCatName.trim();
    if (!name) return;

    try {
      const nextOrder =
        categories.length === 0 ? 0 : Math.max(...categories.map((c) => c.order ?? 0)) + 1;

      await addDoc(catsCol, {
        name,
        order: nextOrder,
        isVisible: true,
        parentCategoryId: formCatParentId || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setFormCatName("");
      setFormCatParentId("");
      await loadCategories();
      toast({ title: "Categoría creada" });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Error", description: "No se pudo crear la categoría." });
    }
  }

  function startEditCategory(cat: Category) {
    setCatEditingId(cat.id);
    setCatForm({
      name: cat.name,
      order: cat.order ?? 0,
      isVisible: !!cat.isVisible,
      parentCategoryId: cat.parentCategoryId ?? null,
    });
    setCatModalOpen(true);
  }

  async function saveCategoryEdit() {
    if (!catEditingId) return;
    try {
      await updateDoc(doc(catsCol, catEditingId), {
        name: catForm.name.trim(),
        order: Number(catForm.order) || 0,
        isVisible: catForm.isVisible,
        parentCategoryId: catForm.parentCategoryId ?? null,
        updatedAt: serverTimestamp(),
      });

      setCatModalOpen(false);
      setCatEditingId(null);
      await loadCategories();
      toast({ title: "Categoría actualizada" });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar la categoría." });
    }
  }

  async function onToggleVisible(cat: Category, value: boolean) {
    setCategories((prev) => prev.map((c) => (c.id === cat.id ? { ...c, isVisible: value } : c)));
    try {
      await updateDoc(doc(catsCol, cat.id), { isVisible: value, updatedAt: serverTimestamp() });
    } catch (e) {
      console.error(e);
      setCategories((prev) => prev.map((c) => (c.id === cat.id ? { ...c, isVisible: !value } : c)));
      toast({ variant: "destructive", title: "Error", description: "No se pudo cambiar la visibilidad." });
    }
  }

  async function onDeleteCategory(cat: Category) {
    if (!confirm(`¿Eliminar la categoría "${cat.name}"?`)) return;
    try {
      await deleteDoc(doc(catsCol, cat.id));
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      toast({ title: "Categoría eliminada" });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar la categoría." });
    }
  }

  // ========= DnD PADRES =========
  function handleRootDragStart(index: number) {
    setDragRootIndex(index);
  }

  function handleRootDragOver(e: React.DragEvent<HTMLDivElement>, overIndex: number) {
    e.preventDefault();
    if (dragRootIndex === null || dragRootIndex === overIndex) return;

    const moved = arrayMove(sortedRootCategories, dragRootIndex, overIndex);

    setCategories((prev) => {
      const next = prev.slice();
      moved.forEach((cat, i) => {
        const idx = next.findIndex((c) => c.id === cat.id);
        if (idx !== -1) next[idx] = { ...next[idx], order: i };
      });
      return next;
    });

    setDragRootIndex(overIndex);
  }

  async function handleRootDragEnd() {
    if (dragRootIndex === null) return;
    setDragRootIndex(null);

    try {
      setIsSavingOrder(true);

      const parents = rootCategories.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      await Promise.all(parents.map((c, i) => updateDoc(doc(catsCol, c.id), { order: i, updatedAt: serverTimestamp() })));

      toast({ title: "Orden de categorías padre guardado" });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Error", description: "No se pudo guardar el nuevo orden." });
      await loadCategories();
    } finally {
      setIsSavingOrder(false);
    }
  }

  // ========= DnD ITEMS =========
  function handleDragItemStart(item: MenuItem) {
    if (sortMode !== "manual") return;
    setDragItem(item);
  }

  function handleDragItemOver(e: React.DragEvent<HTMLTableRowElement>, targetItem: MenuItem) {
    if (sortMode !== "manual") return;
    e.preventDefault();
    if (!dragItem) return;
    if (dragItem.id === targetItem.id) return;
    if (dragItem.categoryId !== targetItem.categoryId) return;

    const categoryId = targetItem.categoryId;

    setItems((prev) => {
      const updated = [...prev];
      const fromIndex = updated.findIndex((i) => i.id === dragItem.id);
      const toIndex = updated.findIndex((i) => i.id === targetItem.id);
      if (fromIndex === -1 || toIndex === -1) return prev;

      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);

      let orderCounter = 0;
      updated.forEach((i) => {
        if (i.categoryId === categoryId) i.order = orderCounter++;
      });

      return updated;
    });
  }

  async function handleDragItemEnd() {
    if (!dragItem || sortMode !== "manual") {
      setDragItem(null);
      return;
    }

    try {
      setIsSavingItemsOrder(true);
      const categoryId = dragItem.categoryId;

      const affected = items
        .filter((i) => i.categoryId === categoryId)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      await Promise.all(
        affected.map((item) =>
          updateDoc(doc(itemsCol, item.id), { order: item.order ?? 0, updatedAt: serverTimestamp() })
        )
      );

      toast({ title: "Orden de items guardado" });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Error", description: "No se pudo guardar el orden de los items." });
      await loadItems();
    } finally {
      setIsSavingItemsOrder(false);
      setDragItem(null);
    }
  }

  // ========= SORT + FILTER =========
  function autoSortItems(localItems: MenuItem[], localCats: Category[]) {
    const grouped = new Map<string, MenuItem[]>();
    localItems.forEach((i) => {
      const arr = grouped.get(i.categoryId) ?? [];
      arr.push(i);
      grouped.set(i.categoryId, arr);
    });

    const sortedCategories = localCats.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const result: MenuItem[] = [];
    sortedCategories.forEach((cat) => {
      const arr = grouped.get(cat.id);
      if (!arr) return;
      arr
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }))
        .forEach((item) => result.push(item));
    });

    localItems.forEach((item) => {
      if (!result.find((r) => r.id === item.id)) result.push(item);
    });

    return result;
  }

  function manualSortItems(localItems: MenuItem[], localCats: Category[]) {
    const grouped = new Map<string, MenuItem[]>();
    localItems.forEach((i) => {
      const arr = grouped.get(i.categoryId) ?? [];
      arr.push(i);
      grouped.set(i.categoryId, arr);
    });

    const sortedCategories = localCats.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const result: MenuItem[] = [];
    sortedCategories.forEach((cat) => {
      let arr = grouped.get(cat.id);
      if (!arr) return;

      arr = arr.slice().sort((a, b) => {
        const oa = a.order ?? 0;
        const ob = b.order ?? 0;
        if (oa !== ob) return oa - ob;
        return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
      });

      arr.forEach((item) => result.push(item));
    });

    localItems.forEach((item) => {
      if (!result.find((r) => r.id === item.id)) result.push(item);
    });

    return result;
  }

  const baseSortedItems = sortMode === "auto" ? autoSortItems(items, categories) : manualSortItems(items, categories);
  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredBySearch = !normalizedSearch
    ? baseSortedItems
    : baseSortedItems.filter((item) => {
        const category = categories.find((c) => c.id === item.categoryId);
        const name = item.name.toLowerCase();
        const catName = (category?.name ?? "").toLowerCase();

        const parentId = getItemParentId(item);
        const parentName = parentId ? (categoryById.get(parentId)?.name ?? "").toLowerCase() : "";

        return name.includes(normalizedSearch) || catName.includes(normalizedSearch) || parentName.includes(normalizedSearch);
      });

  const sortedItems = !parentFilterId ? filteredBySearch : filteredBySearch.filter((item) => getItemParentId(item) === parentFilterId);

  // ========= UI =========
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Gestionar Menú</h1>
        <p className="text-muted-foreground">
          Tenant: <span className="font-medium">{tenantId}</span>
        </p>
      </div>

      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items">Items del Menú</TabsTrigger>
          <TabsTrigger value="categories">Categorías</TabsTrigger>
        </TabsList>

        {/* ============ ITEMS ============ */}
        <TabsContent value="items" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Platos y Bebidas</CardTitle>
              <CardDescription>Administrá todos los items de tu menú.</CardDescription>

              <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Buscar:</Label>
                    <Input
                      className="h-9 w-52"
                      placeholder="Nombre o categoría..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Categoría padre:</Label>
                    <select
                      className="h-9 rounded-md border bg-background px-2 text-sm min-w-[220px]"
                      value={parentFilterId}
                      onChange={(e) => setParentFilterId(e.target.value)}
                    >
                      <option value="">Todas</option>
                      {sortedRootCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Orden:</Label>
                    <select
                      className="h-9 rounded-md border bg-background px-2 text-sm"
                      value={sortMode}
                      onChange={(e) => setSortMode(e.target.value as any)}
                    >
                      <option value="manual">Manual</option>
                      <option value="auto">A-Z</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isSavingItemsOrder && (
                    <span className="text-xs text-muted-foreground">Guardando orden de items…</span>
                  )}

                  <Sheet open={createOpen} onOpenChange={setCreateOpen}>
                    <SheetTrigger asChild>
                      <Button onClick={() => setCreateForm(emptyItem)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Agregar Item
                      </Button>
                    </SheetTrigger>

                    <SheetContent className="sm:max-w-lg overflow-y-auto">
                      <SheetHeader>
                        <SheetTitle>Agregar Nuevo Item</SheetTitle>
                        <SheetDescription>Completá los detalles del plato o bebida.</SheetDescription>
                      </SheetHeader>

                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="c-name" className="text-right">
                            Nombre
                          </Label>
                          <Input
                            id="c-name"
                            className="col-span-3"
                            value={createForm.name}
                            onChange={(e) => onChangeCreate("name", e.target.value)}
                          />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="c-description" className="text-right">
                            Descripción
                          </Label>
                          <Textarea
                            id="c-description"
                            className="col-span-3"
                            value={createForm.description}
                            onChange={(e) => onChangeCreate("description", e.target.value)}
                          />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="c-price" className="text-right">
                            Precio (ARS)
                          </Label>
                          <Input
                            id="c-price"
                            type="number"
                            className="col-span-3"
                            value={createForm.price}
                            onChange={(e) => onChangeCreate("price", Number(e.target.value))}
                          />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="c-category" className="text-right">
                            Categoría
                          </Label>
                          <select
                            id="c-category"
                            className="col-span-3 h-9 rounded-md border bg-background px-2 text-sm"
                            value={createForm.categoryId}
                            onChange={(e) => onChangeCreate("categoryId", e.target.value)}
                          >
                            <option value="">Elegí una categoría…</option>
                            {categoryOptions.map((o) => (
                              <option key={o.id} value={o.id}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="c-imageId" className="text-right">
                            Imagen ID
                          </Label>
                          <Input
                            id="c-imageId"
                            className="col-span-3"
                            value={createForm.imageId}
                            onChange={(e) => onChangeCreate("imageId", e.target.value)}
                          />
                        </div>

                        <Button onClick={handleGenerateKeywords} disabled={isGenerating}>
                          {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Generar Keywords con IA
                        </Button>
                      </div>

                      <SheetFooter>
                        <SheetClose asChild>
                          <Button
                            type="button"
                            onClick={handleCreateItem}
                            disabled={!createForm.name || !createForm.categoryId}
                          >
                            Guardar Item
                          </Button>
                        </SheetClose>
                      </SheetFooter>
                    </SheetContent>
                  </Sheet>
                </div>
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
                      <TableHead>Visible</TableHead>
                      <TableHead>Especial</TableHead>
                      <TableHead className="w-[100px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {sortedItems.map((item) => {
                      const category = categories.find((c) => c.id === item.categoryId);
                      const parentId = getItemParentId(item);
                      const parentName = parentId ? categoryById.get(parentId)?.name : undefined;

                      const image = PlaceHolderImages.find((p) => p.id === item.imageId);

                      return (
                        <TableRow
                          key={item.id}
                          draggable={sortMode === "manual"}
                          onDragStart={() => handleDragItemStart(item)}
                          onDragOver={(e) => handleDragItemOver(e, item)}
                          onDragEnd={handleDragItemEnd}
                        >
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

                          <TableCell className="font-medium">{item.name}</TableCell>

                          <TableCell>
                            {parentName && category?.parentCategoryId ? (
                              <span className="text-sm">
                                <span className="text-muted-foreground">{parentName}</span>
                                <span className="text-muted-foreground"> {" > "} </span>
                                <span>{category?.name}</span>
                              </span>
                            ) : (
                              <span>{category?.name}</span>
                            )}
                          </TableCell>

                          <TableCell>{formatCurrency(item.price)}</TableCell>

                          <TableCell>
                            <Switch
                              checked={!!item.isVisible}
                              onCheckedChange={(v) => handleToggleItem(item.id, "isVisible", v)}
                            />
                          </TableCell>

                          <TableCell>
                            <Switch
                              checked={!!item.isSpecial}
                              onCheckedChange={(v) => handleToggleItem(item.id, "isSpecial", v)}
                            />
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleStartEdit(item)}>
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
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* EDIT ITEM */}
          <Sheet open={editOpen} onOpenChange={setEditOpen}>
            <SheetContent className="sm:max-w-lg overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Editar Item</SheetTitle>
                <SheetDescription>Actualizá los datos del plato o bebida.</SheetDescription>
              </SheetHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="e-name" className="text-right">
                    Nombre
                  </Label>
                  <Input
                    id="e-name"
                    className="col-span-3"
                    value={editForm.name}
                    onChange={(e) => onChangeEdit("name", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="e-description" className="text-right">
                    Descripción
                  </Label>
                  <Textarea
                    id="e-description"
                    className="col-span-3"
                    value={editForm.description}
                    onChange={(e) => onChangeEdit("description", e.target.value)}
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
                    value={editForm.price}
                    onChange={(e) => onChangeEdit("price", Number(e.target.value))}
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="e-category" className="text-right">
                    Categoría
                  </Label>
                  <select
                    id="e-category"
                    className="col-span-3 h-9 rounded-md border bg-background px-2 text-sm"
                    value={editForm.categoryId}
                    onChange={(e) => onChangeEdit("categoryId", e.target.value)}
                  >
                    <option value="">Elegí una categoría…</option>
                    {categoryOptions.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
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
                    value={editForm.imageId}
                    onChange={(e) => onChangeEdit("imageId", e.target.value)}
                  />
                </div>

                <Button onClick={handleGenerateKeywords} disabled={isGenerating}>
                  {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Generar Keywords con IA
                </Button>
              </div>

              <SheetFooter>
                <SheetClose asChild>
                  <Button type="button" onClick={handleUpdateItem} disabled={!editId}>
                    Guardar Cambios
                  </Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </TabsContent>

        {/* ============ CATEGORÍAS ============ */}
        <TabsContent value="categories" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Categorías del Menú</CardTitle>
              <CardDescription>Organizá las secciones de tu menú.</CardDescription>
            </CardHeader>

            <CardContent>
              <div className="mb-4 flex flex-wrap items-end gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="new-cat-name">Nombre</Label>
                  <Input
                    id="new-cat-name"
                    placeholder="Ej: Entradas"
                    value={formCatName}
                    onChange={(e) => setFormCatName(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="new-cat-parent">Categoría padre</Label>
                  <select
                    id="new-cat-parent"
                    className="h-9 rounded-md border bg-background px-2 text-sm min-w-[180px]"
                    value={formCatParentId}
                    onChange={(e) => setFormCatParentId(e.target.value)}
                  >
                    <option value="">Ninguna (categoría principal)</option>
                    {sortedRootCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2">
                  <Label className="invisible">.</Label>
                  <Button onClick={onCreateCategory}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Crear
                  </Button>
                </div>
              </div>

              {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aún no hay categorías.</p>
              ) : (
                <div className="space-y-3">
                  {sortedRootCategories.map((parent, index) => {
                    const children = childrenByParent.get(parent.id) ?? [];
                    return (
                      <div key={parent.id} className="space-y-2">
                        <div
                          className="flex items-center justify-between p-3 bg-secondary rounded-md cursor-pointer select-none"
                          draggable
                          onClick={() => toggleParent(parent.id)}
                          onDragStart={() => handleRootDragStart(index)}
                          onDragOver={(e) => handleRootDragOver(e, index)}
                          onDragEnd={handleRootDragEnd}
                        >
                          <div className="flex items-center gap-3">
                            {openParents[parent.id] ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}

                            <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                            <span className="font-semibold">{parent.name}</span>

                            {isSavingOrder && (
                              <span className="text-xs text-muted-foreground">Guardando…</span>
                            )}
                          </div>

                          <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center space-x-2">
                              <Label htmlFor={`visible-${parent.id}`} className="text-sm">
                                Visible
                              </Label>
                              <Switch
                                id={`visible-${parent.id}`}
                                checked={!!parent.isVisible}
                                onCheckedChange={(v) => onToggleVisible(parent, v)}
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="icon" onClick={() => startEditCategory(parent)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => onDeleteCategory(parent)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {openParents[parent.id] &&
                          children.map((child) => (
                            <div
                              key={child.id}
                              className="ml-8 flex items-center justify-between p-3 bg-secondary/60 rounded-md border border-border/40"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-muted-foreground">↳</span>
                                <span className="font-medium">{child.name}</span>
                              </div>

                              <div className="flex items-center gap-4">
                                <div className="flex items-center space-x-2">
                                  <Label htmlFor={`visible-${child.id}`} className="text-sm">
                                    Visible
                                  </Label>
                                  <Switch
                                    id={`visible-${child.id}`}
                                    checked={!!child.isVisible}
                                    onCheckedChange={(v) => onToggleVisible(child, v)}
                                  />
                                </div>

                                <div className="flex items-center gap-2">
                                  <Button variant="ghost" size="icon" onClick={() => startEditCategory(child)}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive"
                                    onClick={() => onDeleteCategory(child)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    );
                  })}
                </div>
              )}

              <Sheet open={catModalOpen} onOpenChange={setCatModalOpen}>
                <SheetContent className="sm:max-w-lg">
                  <SheetHeader>
                    <SheetTitle>Editar categoría</SheetTitle>
                    <SheetDescription>Modificá el nombre, orden o visibilidad.</SheetDescription>
                  </SheetHeader>

                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="cat-name" className="text-right">
                        Nombre
                      </Label>
                      <Input
                        id="cat-name"
                        className="col-span-3"
                        value={catForm.name}
                        onChange={(e) => setCatForm((p) => ({ ...p, name: e.target.value }))}
                      />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="cat-order" className="text-right">
                        Orden
                      </Label>
                      <Input
                        id="cat-order"
                        type="number"
                        className="col-span-3"
                        value={catForm.order}
                        onChange={(e) => setCatForm((p) => ({ ...p, order: Number(e.target.value) }))}
                      />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="cat-parent" className="text-right">
                        Categoría padre
                      </Label>
                      <select
                        id="cat-parent"
                        className="col-span-3 h-9 rounded-md border bg-background px-2 text-sm"
                        value={catForm.parentCategoryId ?? ""}
                        onChange={(e) => setCatForm((p) => ({ ...p, parentCategoryId: e.target.value || null }))}
                      >
                        <option value="">Ninguna (categoría principal)</option>
                        {sortedRootCategories
                          .filter((c) => c.id !== catEditingId)
                          .map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Visible</Label>
                      <div className="col-span-3">
                        <Switch
                          checked={catForm.isVisible}
                          onCheckedChange={(v) => setCatForm((p) => ({ ...p, isVisible: v }))}
                        />
                      </div>
                    </div>
                  </div>

                  <SheetFooter>
                    <SheetClose asChild>
                      <Button variant="secondary">Cancelar</Button>
                    </SheetClose>
                    <Button onClick={saveCategoryEdit}>Guardar</Button>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

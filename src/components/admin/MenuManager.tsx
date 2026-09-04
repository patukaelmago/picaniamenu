"use client";


import React, { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
  setDoc,
  onSnapshot,
} from "firebase/firestore";

import { useTenantUI } from "@/hooks/use-tenant-ui";
import { useRestaurantSettings } from "@/hooks/use-restaurant-settings";
import MenuCsvImporter from "@/components/admin/MenuCsvImporter";

import { db, storage } from "@/lib/firebase";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
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
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  GripVertical,
  ChevronRight,
  ChevronDown,
  ImagePlus,
  X,
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
import { useToast } from "@/hooks/use-toast";
import {
  DEFAULT_MENU_VARIANT_SCHEDULE,
  findScheduleConflict,
  parseMenuVariantSchedule,
  resolveMenuVariant,
  type MenuVariantSchedule,
} from "@/lib/menu-variant-schedule";

type Props = { tenantId: string };
type MenuVariant = "A" | "B";
type OrderedEntry = { order: number; orderA?: number; orderB?: number };
const WEEK_DAYS = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mié" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sáb" },
  { value: 0, label: "Dom" },
];

const getMenuOrder = (entry: OrderedEntry, variant: MenuVariant) =>
  variant === "A"
    ? entry.orderA ?? entry.order ?? 0
    : entry.orderB ?? entry.order ?? 0;

const withMenuOrder = <T extends OrderedEntry>(
  entry: T,
  variant: MenuVariant,
  order: number
): T =>
  ({
    ...entry,
    ...(variant === "A" ? { order, orderA: order } : { orderB: order }),
  }) as T;

const formatCurrency = (price: number, currency: "ARS" | "USD") =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
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
  showImage: true,
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

const hasSinTacc = (tags: MenuItemInput["tags"] | undefined) =>
  (tags ?? []).includes("sin TACC");

const withSinTacc = (
  tags: MenuItemInput["tags"] | undefined,
  enabled: boolean
): MenuItemInput["tags"] => {
  const next = (tags ?? []).filter((tag) => tag !== "sin TACC");
  return enabled ? [...next, "sin TACC"] : next;
};

export default function MenuManager({ tenantId }: Props) {
  const ui = useTenantUI(tenantId);
  const settings = useRestaurantSettings();
  const tenantCurrency: "ARS" | "USD" =
    settings?.currency === "USD" ? "USD" : "ARS";
  const { toast } = useToast();

  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [tenantName, setTenantName] = useState("");
  const [activeMenuTab, setActiveMenuTab] = useState("categories");
  const [activeMenuVariant, setActiveMenuVariant] = useState<MenuVariant>("A");
  const [manualMenuVariant, setManualMenuVariant] = useState<MenuVariant>("A");
  const [menuAutomation, setMenuAutomation] = useState<MenuVariantSchedule>(
    DEFAULT_MENU_VARIANT_SCHEDULE
  );
  const [orderMenuVariant, setOrderMenuVariant] = useState<MenuVariant>("A");
  const [savingMenuVariant, setSavingMenuVariant] = useState(false);
  const [savingMenuAutomation, setSavingMenuAutomation] = useState(false);
  const [menuPublicationOpen, setMenuPublicationOpen] = useState(false);

  const [formCatName, setFormCatName] = useState("");
  const [formCatParentId, setFormCatParentId] = useState<string>("");

  const [openParents, setOpenParents] = useState<Record<string, boolean>>({});
  const toggleParent = (id: string) =>
    setOpenParents((p) => ({ ...p, [id]: !p[id] }));

  const [parentFilterId, setParentFilterId] = useState<string>("");

  const [dragRootIndex, setDragRootIndex] = useState<number | null>(null);
  const [dragChild, setDragChild] = useState<{
    parentId: string;
    index: number;
  } | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const [catEditingId, setCatEditingId] = useState<string | null>(null);
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [catForm, setCatForm] = useState<{
    name: string;
    description: string;
    order: number;
    isVisible: boolean;
    menuVariants: MenuVariant[];
    parentCategoryId: string | null;
  }>({
    name: "",
    description: "",
    order: 0,
    isVisible: true,
    menuVariants: ["A", "B"],
    parentCategoryId: null,
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<MenuItemInput>(emptyItem);
  const [createImageFile, setCreateImageFile] = useState<File | null>(null);
  const [createImagePreview, setCreateImagePreview] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<MenuItemInput>(emptyItem);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState("");
  const createImageInputRef = useRef<HTMLInputElement | null>(null);
  const editImageInputRef = useRef<HTMLInputElement | null>(null);

  const [sortMode, setSortMode] = useState<"auto" | "manual">("manual");
  const [searchTerm, setSearchTerm] = useState("");
  const [dragItem, setDragItem] = useState<MenuItem | null>(null);
  const [isSavingItemsOrder, setIsSavingItemsOrder] = useState(false);

  const catsCol = useMemo(
    () => collection(db, "tenants", tenantId, "categories"),
    [tenantId]
  );

  const itemsCol = useMemo(
    () => collection(db, "tenants", tenantId, "menuItems"),
    [tenantId]
  );

  async function loadTenantName() {
    const snap = await getDoc(doc(db, "tenants", tenantId));
    const data: any = snap.exists() ? snap.data() : {};

    setTenantName(
      data?.brandName ||
      data?.commercialName ||
      data?.businessName ||
      data?.displayName ||
      data?.name ||
      tenantId
    );
  }

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
        description: raw.description ?? raw.desc ?? "",
        order: typeof raw.order === "number" ? raw.order : Number(raw.order) || 0,
        orderA: typeof raw.orderA === "number" ? raw.orderA : undefined,
        orderB: typeof raw.orderB === "number" ? raw.orderB : undefined,
        isVisible,
        menuVariants: Array.isArray(raw.menuVariants)
          ? raw.menuVariants.filter(
              (variant: unknown): variant is MenuVariant =>
                variant === "A" || variant === "B"
            )
          : isVisible
            ? ["A", "B"]
            : [],
        parentCategoryId: raw.parentCategoryId ?? null,
      } as Category;
    });

    setCategories(data);

    setParentFilterId((prev) => {
      if (prev) return prev;
      return "";
    });
  }

  async function loadItems() {
    const q = query(itemsCol, orderBy("order", "asc"));
    const snap = await getDocs(q);

    const data = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as any),
    })) as any[];

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
          showImage: x.showImage ?? true,
          categoryId: x.categoryId ?? "",
          isVisible: x.isVisible ?? true,
          inStock: x.inStock ?? true,
          isSpecial: x.isSpecial ?? false,
          menuVariants: Array.isArray(x.menuVariants) ? x.menuVariants : undefined,
          tags: x.tags ?? [],
          allergens: x.allergens ?? [],
          searchKeywords: x.searchKeywords ?? [],
          order: Number(x.order ?? 0),
          orderA: typeof x.orderA === "number" ? x.orderA : undefined,
          orderB: typeof x.orderB === "number" ? x.orderB : undefined,
        } as MenuItem)
      )
    );
  }

  async function reloadAll() {
    await Promise.all([loadTenantName(), loadCategories(), loadItems()]);
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

  useEffect(() => {
    return onSnapshot(
      doc(db, "tenants", tenantId, "settings", "menuVariants"),
      (snapshot) => {
        const data = snapshot.data();
        const manual = data?.activeVariant === "B" ? "B" : "A";
        const automation = parseMenuVariantSchedule(data?.automation);
        setManualMenuVariant(manual);
        setMenuAutomation(automation);
        setActiveMenuVariant(resolveMenuVariant(manual, automation));
      }
    );
  }, [tenantId]);

  useEffect(() => {
    const updateVariant = () =>
      setActiveMenuVariant(resolveMenuVariant(manualMenuVariant, menuAutomation));
    updateVariant();
    const timer = window.setInterval(updateVariant, 30_000);
    return () => window.clearInterval(timer);
  }, [manualMenuVariant, menuAutomation]);

  async function handleActiveMenuVariant(next: "A" | "B") {
    if (next === manualMenuVariant && !menuAutomation.enabled) return;

    const previousManualMenuVariant = manualMenuVariant;
    const previousActiveMenuVariant = activeMenuVariant;
    const previousMenuAutomation = menuAutomation;
    const nextMenuAutomation = menuAutomation.enabled
      ? { ...menuAutomation, enabled: false }
      : menuAutomation;
    setManualMenuVariant(next);
    setActiveMenuVariant(next);
    setMenuAutomation(nextMenuAutomation);
    setSavingMenuVariant(true);

    try {
      await setDoc(
        doc(db, "tenants", tenantId, "settings", "menuVariants"),
        {
          activeVariant: next,
          automation: nextMenuAutomation,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      toast({ title: `Carta ${next} publicada` });
    } catch (e) {
      console.error(e);
      setManualMenuVariant(previousManualMenuVariant);
      setActiveMenuVariant(previousActiveMenuVariant);
      setMenuAutomation(previousMenuAutomation);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cambiar la carta publicada.",
      });
    } finally {
      setSavingMenuVariant(false);
    }
  }

  async function saveMenuAutomation() {
    if (
      menuAutomation.enabled &&
      menuAutomation.rules.some(
        (rule) => rule.days.length === 0 || rule.startTime === rule.endTime
      )
    ) {
      toast({
        variant: "destructive",
        title: "Revisá los horarios",
        description: "Cada horario debe tener días elegidos y horas diferentes.",
      });
      return;
    }

    const conflict = findScheduleConflict(menuAutomation.rules);
    if (menuAutomation.enabled && conflict) {
      toast({
        variant: "destructive",
        title: "Hay horarios superpuestos",
        description: `El horario ${conflict[0] + 1} se superpone con el horario ${conflict[1] + 1}.`,
      });
      return;
    }

    setSavingMenuAutomation(true);
    try {
      await setDoc(
        doc(db, "tenants", tenantId, "settings", "menuVariants"),
        { automation: menuAutomation, updatedAt: serverTimestamp() },
        { merge: true }
      );
      setActiveMenuVariant(resolveMenuVariant(manualMenuVariant, menuAutomation));
      toast({ title: "Automatización guardada" });
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar la automatización.",
      });
    } finally {
      setSavingMenuAutomation(false);
    }
  }

  async function handleToggleMenuVariant(
    item: MenuItem,
    variant: "A" | "B",
    enabled: boolean
  ) {
    const current = item.menuVariants ?? ["A"];
    const menuVariants = enabled
      ? Array.from(new Set([...current, variant]))
      : current.filter((value) => value !== variant);
  
    setItems((prev) =>
      prev.map((entry) =>
        entry.id === item.id ? { ...entry, menuVariants } : entry
      )
    );
  
    try {
      await updateDoc(doc(itemsCol, item.id), {
        menuVariants,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error(e);
      setItems((prev) =>
        prev.map((entry) =>
          entry.id === item.id
            ? { ...entry, menuVariants: item.menuVariants }
            : entry
        )
      );
      toast({
        variant: "destructive",
        title: "Error",
        description: `No se pudo actualizar la Carta ${variant}.`,
      });
    }
  }
  
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
        arr
          .slice()
          .sort(
            (a, b) =>
              getMenuOrder(a, orderMenuVariant) -
              getMenuOrder(b, orderMenuVariant)
          )
      );
    });

    return m;
  }, [categories, orderMenuVariant]);

  const sortedRootCategories = useMemo(
    () =>
      rootCategories
        .slice()
        .sort(
          (a, b) =>
            getMenuOrder(a, orderMenuVariant) -
            getMenuOrder(b, orderMenuVariant)
        ),
    [rootCategories, orderMenuVariant]
  );

  const categoryOptions = useMemo(() => {
    const options: Array<{
      id: string;
      label: string;
      isChild: boolean;
      parentId: string | null;
    }> = [];

    sortedRootCategories.forEach((parent) => {
      options.push({
        id: parent.id,
        label: parent.name,
        isChild: false,
        parentId: null,
      });

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

  function onChangeCreate<K extends keyof MenuItemInput>(
    key: K,
    value: MenuItemInput[K]
  ) {
    setCreateForm((p) => ({ ...p, [key]: value }));
  }

  function onChangeEdit<K extends keyof MenuItemInput>(
    key: K,
    value: MenuItemInput[K]
  ) {
    setEditForm((p) => ({ ...p, [key]: value }));
  }

  async function uploadItemImage(file: File, itemName: string) {
    const ext = file.name.split(".").pop() || "jpg";
    const safeName = norm(itemName).replace(/[^a-z0-9]+/g, "-") || "item";
    const imageRef = ref(
      storage,
      `tenants/${tenantId}/menu-items/${safeName}-${Date.now()}.${ext}`
    );
    await uploadBytes(imageRef, file);
    return getDownloadURL(imageRef);
  }

  function validateImage(file: File) {
    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Archivo inválido",
        description: "Elegí una imagen JPG, PNG o WebP.",
      });
      return false;
    }
    return true;
  }

  function selectCreateImage(file: File | null) {
    if (!file || !validateImage(file)) return;
    if (createImagePreview.startsWith("blob:")) URL.revokeObjectURL(createImagePreview);
    setCreateImageFile(file);
    setCreateImagePreview(URL.createObjectURL(file));
    setCreateForm((prev) => ({ ...prev, showImage: true }));
  }

  function selectEditImage(file: File | null) {
    if (!file || !validateImage(file)) return;
    if (editImagePreview.startsWith("blob:")) URL.revokeObjectURL(editImagePreview);
    setEditImageFile(file);
    setEditImagePreview(URL.createObjectURL(file));
    setEditForm((prev) => ({ ...prev, showImage: true }));
  }

  async function handleCreateItem() {
    try {
      const imageUrl = createImageFile
        ? await uploadItemImage(createImageFile, createForm.name)
        : createForm.imageUrl;
  
      await addDoc(itemsCol, {
        ...createForm,
        menuVariants: ["A"],
        currency: tenantCurrency,
        imageUrl,
        imageId: "",
        order: Number(createForm.order ?? 0),
        orderA: Number(createForm.order ?? 0),
        orderB: Number(createForm.order ?? 0),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
  
      toast({ title: "Plato creado" });
      setCreateForm(emptyItem);
  
      if (createImagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(createImagePreview);
      }
  
      setCreateImageFile(null);
      setCreateImagePreview("");
      setCreateOpen(false);
      await loadItems();
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear el plato.",
      });
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
      showImage: item.showImage ?? true,
      categoryId: item.categoryId,
      isVisible: item.isVisible,
      inStock: item.inStock,
      isSpecial: item.isSpecial,
      menuVariants: item.menuVariants,
      tags: item.tags ?? [],
      allergens: item.allergens ?? [],
      searchKeywords: item.searchKeywords ?? [],
      order: item.order ?? 0,
      orderA: item.orderA ?? item.order ?? 0,
      orderB: item.orderB ?? item.order ?? 0,
    });

    setEditImageFile(null);
    setEditImagePreview(item.imageUrl || "");
    setEditOpen(true);
  }

  async function handleUpdateItem() {
    if (!editId) return;
  
    try {
      const imageUrl = editImageFile
        ? await uploadItemImage(editImageFile, editForm.name)
        : editForm.imageUrl;
  
      const { menuVariants, ...itemFields } = editForm;
      
      await updateDoc(doc(itemsCol, editId), {
        ...itemFields,
        ...(menuVariants ? { menuVariants } : {}),
        currency: tenantCurrency,
        imageUrl,
        imageId: "",
        order: Number(editForm.order ?? 0),
        updatedAt: serverTimestamp(),
      });
  
      toast({ title: "Plato actualizado" });
      setEditOpen(false);
      setEditId(null);
      setEditForm(emptyItem);
  
      if (editImagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(editImagePreview);
      }
  
      setEditImageFile(null);
      setEditImagePreview("");
      await loadItems();
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el plato.",
      });
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
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el plato.",
      });
    }
  }

  async function handleToggleItem(
    id: string,
    field: "inStock" | "isVisible",
    value: boolean
  ) {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? ({ ...it, [field]: value } as MenuItem) : it))
    );

    try {
      await updateDoc(doc(itemsCol, id), {
        [field]: value,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error(e);
    
      setItems((prev) =>
        prev.map((it) =>
          it.id === id ? ({ ...it, [field]: !value } as MenuItem) : it
        )
      );

      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el estado del item.",
      });
    }
  }

  async function onCreateCategory() {
  const name = formCatName.trim();
  if (!name) return;

  try {
    const nextOrder =
      categories.length === 0
        ? 0
        : Math.max(...categories.map((c) => c.order ?? 0)) + 1;

    await addDoc(catsCol, {
      name,
      description: "",
      order: nextOrder,
      orderA: nextOrder,
      orderB: nextOrder,
      isVisible: true,
      menuVariants: ["A", "B"],
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
    toast({
      variant: "destructive",
      title: "Error",
      description: "No se pudo crear la categoría.",
    });
  }
}

function startEditCategory(cat: Category) {
  setCatEditingId(cat.id);
  setCatForm({
    name: cat.name,
    description: cat.description ?? "",
    order: cat.order ?? 0,
    isVisible: cat.isVisible,
    menuVariants: cat.menuVariants ?? (cat.isVisible ? ["A", "B"] : []),
    parentCategoryId: cat.parentCategoryId ?? null,
  });

  setCatModalOpen(true);
}

async function saveCategoryEdit() {
  if (!catEditingId) return;

  try {
    await updateDoc(doc(catsCol, catEditingId), {
      name: catForm.name.trim(),
      description: catForm.description?.trim() ?? "",
      order: Number(catForm.order) || 0,
      isVisible: catForm.isVisible,
      menuVariants: catForm.menuVariants,
      parentCategoryId: catForm.parentCategoryId ?? null,
      updatedAt: serverTimestamp(),
    });

    setCatModalOpen(false);
    setCatEditingId(null);
    await loadCategories();
    toast({ title: "Categoría actualizada" });
  } catch (e) {
    console.error(e);
    toast({
      variant: "destructive",
      title: "Error",
      description: "No se pudo actualizar la categoría.",
    });
  }
}

  async function onToggleCategoryVisible(cat: Category, isVisible: boolean) {
    setCategories((previous) =>
      previous.map((category) =>
        category.id === cat.id ? { ...category, isVisible } : category
      )
    );

    try {
      await updateDoc(doc(catsCol, cat.id), {
        isVisible,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error(error);
      setCategories((previous) =>
        previous.map((category) => (category.id === cat.id ? cat : category))
      );
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cambiar la visibilidad de la categoría.",
      });
    }
  }

  async function onToggleCategoryVariant(
    cat: Category,
    variant: MenuVariant,
    enabled: boolean
  ) {
    const current = cat.menuVariants ?? (cat.isVisible ? ["A", "B"] : []);
    const menuVariants = enabled
      ? Array.from(new Set([...current, variant]))
      : current.filter((entry) => entry !== variant);
    setCategories((prev) =>
      prev.map((c) =>
        c.id === cat.id ? { ...c, menuVariants } : c
      )
    );

    try {
      await updateDoc(doc(catsCol, cat.id), {
        menuVariants,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error(e);
    
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? cat : c))
      );

      toast({
        variant: "destructive",
        title: "Error",
        description: `No se pudo cambiar la visibilidad en Carta ${variant}.`,
      });
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
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar la categoría.",
      });
    }
  }

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
        if (idx !== -1) {
          next[idx] = withMenuOrder(next[idx], orderMenuVariant, i);
        }
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

      const parents = rootCategories
        .slice()
        .sort(
          (a, b) =>
            getMenuOrder(a, orderMenuVariant) -
            getMenuOrder(b, orderMenuVariant)
        );

      const orderField = orderMenuVariant === "A" ? "orderA" : "orderB";
        
        await Promise.all(
          parents.map((c, i) =>
            updateDoc(doc(catsCol, c.id), {
              [orderField]: i,
              ...(orderMenuVariant === "A" ? { order: i } : {}),
              updatedAt: serverTimestamp(),
            })
          )
        );

      toast({ title: `Orden de Carta ${orderMenuVariant} guardado` });
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar el nuevo orden.",
      });
      await loadCategories();
    } finally {
      setIsSavingOrder(false);
    }
  }

  function handleChildDragStart(parentId: string, index: number) {
    setDragChild({ parentId, index });
  }

  function handleChildDragOver(
    e: React.DragEvent<HTMLDivElement>,
    parentId: string,
    overIndex: number
  ) {
    e.preventDefault();

    if (!dragChild || dragChild.parentId !== parentId) return;
    if (dragChild.index === overIndex) return;

    const siblings = childrenByParent.get(parentId) ?? [];
    const moved = arrayMove(siblings, dragChild.index, overIndex);

    setCategories((prev) => {
      const next = prev.slice();

      moved.forEach((category, index) => {
        const categoryIndex = next.findIndex((c) => c.id === category.id);
        if (categoryIndex !== -1) {
          next[categoryIndex] = withMenuOrder(
            next[categoryIndex],
            orderMenuVariant,
            index
          );
        }
      });

      return next;
    });

    setDragChild({ parentId, index: overIndex });
  }

  async function handleChildDragEnd(parentId: string) {
    if (!dragChild || dragChild.parentId !== parentId) return;

    setDragChild(null);

    try {
      setIsSavingOrder(true);

      const siblings = (childrenByParent.get(parentId) ?? [])
        .slice()
        .sort(
          (a, b) =>
            getMenuOrder(a, orderMenuVariant) -
            getMenuOrder(b, orderMenuVariant)
        );

      const orderField = orderMenuVariant === "A" ? "orderA" : "orderB";

      await Promise.all(
        siblings.map((category, index) =>
          updateDoc(doc(catsCol, category.id), {
            [orderField]: index,
            ...(orderMenuVariant === "A" ? { order: index } : {}),
            updatedAt: serverTimestamp(),
          })
        )
      );

      toast({ title: `Orden de subcategorías de Carta ${orderMenuVariant} guardado` });
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar el orden de las subcategorías.",
      });
      await loadCategories();
    } finally {
      setIsSavingOrder(false);
    }
  }

  function handleDragItemStart(item: MenuItem) {
    if (sortMode !== "manual") return;
    setDragItem(item);
  }

  function handleDragItemOver(
    e: React.DragEvent<HTMLTableRowElement>,
    targetItem: MenuItem
  ) {
    if (sortMode !== "manual") return;

    e.preventDefault();

    if (!dragItem) return;
    if (dragItem.id === targetItem.id) return;
    if (dragItem.categoryId !== targetItem.categoryId) return;

    const categoryId = targetItem.categoryId;

    setItems((prev) => {
      const categoryItems = prev
        .filter((item) => item.categoryId === categoryId)
        .sort(
          (a, b) =>
            getMenuOrder(a, orderMenuVariant) -
            getMenuOrder(b, orderMenuVariant)
        );
      const fromIndex = categoryItems.findIndex((i) => i.id === dragItem.id);
      const toIndex = categoryItems.findIndex((i) => i.id === targetItem.id);

      if (fromIndex === -1 || toIndex === -1) return prev;

      const moved = arrayMove(categoryItems, fromIndex, toIndex);
      const orders = new Map(
        moved.map((item, index) => [item.id, index] as const)
      );

      return prev.map((item) => {
        const nextOrder = orders.get(item.id);
        return nextOrder === undefined
          ? item
          : withMenuOrder(item, orderMenuVariant, nextOrder);
      });
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
        .sort(
          (a, b) =>
            getMenuOrder(a, orderMenuVariant) -
            getMenuOrder(b, orderMenuVariant)
        );

      const orderField = orderMenuVariant === "A" ? "orderA" : "orderB";
        
        await Promise.all(
          affected.map((item, index) =>
            updateDoc(doc(itemsCol, item.id), {
              [orderField]: index,
              ...(orderMenuVariant === "A" ? { order: index } : {}),
              updatedAt: serverTimestamp(),
            })
          )
        );

      toast({ title: `Orden de items de Carta ${orderMenuVariant} guardado` });
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar el orden de los items.",
      });
      await loadItems();
    } finally {
      setIsSavingItemsOrder(false);
      setDragItem(null);
    }
  }

  function autoSortItems(localItems: MenuItem[], localCats: Category[]) {
    const grouped = new Map<string, MenuItem[]>();

    localItems.forEach((i) => {
      const arr = grouped.get(i.categoryId) ?? [];
      arr.push(i);
      grouped.set(i.categoryId, arr);
    });

    const sortedCategories = localCats
      .slice()
      .sort(
        (a, b) =>
          getMenuOrder(a, orderMenuVariant) -
          getMenuOrder(b, orderMenuVariant)
      );

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

    const sortedCategories = localCats
      .slice()
      .sort(
        (a, b) =>
          getMenuOrder(a, orderMenuVariant) -
          getMenuOrder(b, orderMenuVariant)
      );

    const result: MenuItem[] = [];

    sortedCategories.forEach((cat) => {
      let arr = grouped.get(cat.id);
      if (!arr) return;

      arr = arr.slice().sort((a, b) => {
        const oa = getMenuOrder(a, orderMenuVariant);
        const ob = getMenuOrder(b, orderMenuVariant);

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

  const baseSortedItems =
    sortMode === "auto"
      ? autoSortItems(items, categories)
      : manualSortItems(items, categories);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredBySearch = !normalizedSearch
    ? baseSortedItems
    : baseSortedItems.filter((item) => {
      const category = categories.find((c) => c.id === item.categoryId);
      const name = item.name.toLowerCase();
      const catName = (category?.name ?? "").toLowerCase();

      const parentId = getItemParentId(item);
      const parentName = parentId
        ? (categoryById.get(parentId)?.name ?? "").toLowerCase()
        : "";

      return (
        name.includes(normalizedSearch) ||
        catName.includes(normalizedSearch) ||
        parentName.includes(normalizedSearch)
      );
    });

  const hiddenFixedFridayItems = ["bebida", "entrada", "postre"];

  const visibleAdminItems = filteredBySearch.filter((item) => {
    const category = categories.find((c) => c.id === item.categoryId);
    const parentId = getItemParentId(item);
    const parentName = parentId ? categoryById.get(parentId)?.name : "";

    const isFixedFridayItem =
      norm(parentName ?? "") === "almuerzo ejecutivo" &&
      norm(category?.name ?? "") === "incluye" &&
      hiddenFixedFridayItems.includes(norm(item.name));

    return !isFixedFridayItem;
  });

  const sortedItems = !parentFilterId
    ? visibleAdminItems
    : visibleAdminItems.filter((item) => getItemParentId(item) === parentFilterId);

  return (
    <div
      className="min-h-screen w-full min-w-0 space-y-4 overflow-x-hidden p-0 sm:space-y-6 sm:p-2"
      style={{ backgroundColor: `hsl(${ui.adminBackground})` }}
    >
      <div
        className="rounded-xl border-l-4 px-5 py-5 shadow-sm sm:px-7 sm:py-6"
        style={{
          backgroundColor: `hsl(${ui.adminSidebarBg})`,
          color: `hsl(${ui.adminSidebarText})`,
          borderLeftColor: `hsl(${ui.adminAccent})`,
        }}
      >
        <h1 className="font-headline text-2xl font-bold sm:text-3xl">
          Gestionar Menú
        </h1>
        <p
          className="mt-1 text-sm"
          style={{ color: `hsl(${ui.adminSidebarText} / 0.72)` }}
        >
          <span className="font-medium">{tenantName || tenantId}</span>
        </p>
      </div>

      <Tabs value={activeMenuTab} onValueChange={setActiveMenuTab} className="w-full min-w-0">
        <div className="flex flex-col items-start gap-4">
      <TabsList
  className="grid w-full grid-cols-2 border p-1 sm:inline-flex sm:h-10 sm:w-fit"
  style={{
    backgroundColor: `hsl(${ui.adminCard})`,
    borderColor: `hsl(${ui.adminSidebarBg} / 0.16)`,
  }}
>
  <TabsTrigger
    value="categories"
    className="transition-colors hover:bg-[hsl(var(--tab-hover-bg))] hover:text-[hsl(var(--tab-hover-text))] data-[state=active]:bg-[hsl(var(--tab-active-bg))] data-[state=active]:text-[hsl(var(--tab-active-text))] sm:px-5"
    style={{
      "--tab-active-bg": ui.adminSidebarBg,
      "--tab-active-text": ui.adminSidebarText,
      "--tab-hover-bg": ui.adminAccent,
      "--tab-hover-text": ui.adminCard,
    } as CSSProperties}
  >
    Categorías
  </TabsTrigger>

  <TabsTrigger
    value="items"
    className="transition-colors hover:bg-[hsl(var(--tab-hover-bg))] hover:text-[hsl(var(--tab-hover-text))] data-[state=active]:bg-[hsl(var(--tab-active-bg))] data-[state=active]:text-[hsl(var(--tab-active-text))] sm:px-5"
    style={{
      "--tab-active-bg": ui.adminSidebarBg,
      "--tab-active-text": ui.adminSidebarText,
      "--tab-hover-bg": ui.adminAccent,
      "--tab-hover-text": ui.adminCard,
    } as CSSProperties}
  >
    Items del Menú
  </TabsTrigger>
</TabsList>
        {activeMenuTab === "items" && (
        <Button
        onClick={() => {
          if (categories.length === 0) {
            setActiveMenuTab("categories");
            toast({
              title: "Creá primero una categoría",
              description: "Después vas a poder agregar items dentro de ella.",
            });
            return;
          }
          setCreateForm({ ...emptyItem, currency: tenantCurrency });
          setCreateOpen(true);
        }}
        className="self-center border border-[hsl(var(--tenant-button-border))] bg-[hsl(var(--tenant-button-bg))] text-[hsl(var(--tenant-button-text))] hover:border-[hsl(var(--tenant-button-hover-bg))] hover:bg-[hsl(var(--tenant-button-hover-bg))] hover:text-[hsl(var(--tenant-button-hover-text))] sm:self-start"
        style={{
          "--tenant-button-bg": ui.adminCardForeground,
          "--tenant-button-text": ui.adminCard,
          "--tenant-button-border": ui.adminForeground,
          "--tenant-button-hover-bg": ui.adminAccent,
          "--tenant-button-hover-text": ui.adminCard,
        } as CSSProperties}
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        Agregar Item
      </Button>
        )}
        </div>

      <Card
          className="mt-4 border-0 shadow-sm ring-1 ring-black/5"
          style={{
            backgroundColor: `hsl(${ui.adminCard})`,
            color: `hsl(${ui.adminCardForeground})`,
          }}
        >
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <button
              type="button"
              className="flex flex-1 items-center justify-between gap-4 text-left"
              aria-expanded={menuPublicationOpen}
              aria-controls="menu-publication-details"
              onClick={() => setMenuPublicationOpen((current) => !current)}
            >
              <div>
                <p className="font-semibold">Carta publicada</p>
                <p className="text-sm opacity-70">
                  El mismo QR muestra la Carta {activeMenuVariant}.
                </p>
              </div>
              {menuPublicationOpen ? (
                <ChevronDown className="h-5 w-5 shrink-0" />
              ) : (
                <ChevronRight className="h-5 w-5 shrink-0" />
              )}
            </button>
            <div
              className="grid shrink-0 grid-cols-2 overflow-hidden rounded-md border"
              style={{ borderColor: `hsl(${ui.adminSidebarBg})` }}
              role="group"
              aria-label="Carta publicada"
            >
              {(["A", "B"] as const).map((variant) => {
                const isActive = activeMenuVariant === variant;

                return (
                  <Button
                    key={variant}
                    type="button"
                    variant="ghost"
                    disabled={savingMenuVariant}
                    aria-pressed={isActive}
                    onClick={() => handleActiveMenuVariant(variant)}
                    className="rounded-none px-5 font-semibold hover:opacity-90"
                    style={{
                      backgroundColor: isActive
                        ? `hsl(${ui.adminAccent})`
                        : `hsl(${ui.adminCard})`,
                      color: isActive
                        ? `hsl(${ui.adminCard})`
                        : `hsl(${ui.adminSidebarBg})`,
                    }}
                  >
                    Carta {variant}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

      {menuPublicationOpen && (
        <div id="menu-publication-details">
      <Card
        className="mt-4 border-0 shadow-sm ring-1 ring-black/5"
        style={{
          backgroundColor: `hsl(${ui.adminCard})`,
          color: `hsl(${ui.adminCardForeground})`,
        }}
      >
        <CardContent className="space-y-5 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold">Cambio automático de carta</p>
              <p className="mt-1 text-sm opacity-70">
                La Carta {activeMenuVariant} es la que se muestra ahora.
              </p>
            </div>
            <Switch
              checked={menuAutomation.enabled}
              onCheckedChange={(enabled) =>
                setMenuAutomation((current) => ({ ...current, enabled }))
              }
              aria-label="Activar cambio automático"
            />
          </div>

          {menuAutomation.enabled && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Label className="font-semibold">Fuera de estos horarios:</Label>
                <div className="grid grid-cols-2 overflow-hidden rounded-md border">
                  {(["A", "B"] as const).map((variant) => (
                    <Button
                      key={variant}
                      type="button"
                      variant="ghost"
                      onClick={() =>
                        setMenuAutomation((current) => ({
                          ...current,
                          defaultVariant: variant,
                        }))
                      }
                      className="rounded-none px-4"
                      style={{
                        backgroundColor:
                          menuAutomation.defaultVariant === variant
                            ? `hsl(${ui.adminAccent})`
                            : `hsl(${ui.adminCard})`,
                        color:
                          menuAutomation.defaultVariant === variant
                            ? `hsl(${ui.adminCard})`
                            : `hsl(${ui.adminCardForeground})`,
                      }}
                    >
                      Carta {variant}
                    </Button>
                  ))}
                </div>
              </div>

              {menuAutomation.rules.map((rule, ruleIndex) => (
                <div key={rule.id} className="space-y-3 rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">Horario {ruleIndex + 1}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Eliminar horario ${ruleIndex + 1}`}
                      onClick={() =>
                        setMenuAutomation((current) => ({
                          ...current,
                          rules: current.rules.filter((item) => item.id !== rule.id),
                        }))
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {WEEK_DAYS.map((day) => {
                      const selected = rule.days.includes(day.value);
                      return (
                        <Button
                          key={day.value}
                          type="button"
                          size="sm"
                          variant={selected ? "default" : "outline"}
                          onClick={() =>
                            setMenuAutomation((current) => ({
                              ...current,
                              rules: current.rules.map((item) =>
                                item.id === rule.id
                                  ? {
                                      ...item,
                                      days: selected
                                        ? item.days.filter((value) => value !== day.value)
                                        : [...item.days, day.value],
                                    }
                                  : item
                              ),
                            }))
                          }
                          style={{
                            backgroundColor: selected
                              ? `hsl(${ui.adminAccent})`
                              : `hsl(${ui.adminCard})`,
                            color: selected
                              ? `hsl(${ui.adminCard})`
                              : `hsl(${ui.adminCardForeground})`,
                            borderColor: `hsl(${ui.adminCardForeground} / 0.3)`,
                          }}
                        >
                          {day.label}
                        </Button>
                      );
                    })}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                    <div className="space-y-1">
                      <Label>Desde</Label>
                      <Input
                        type="time"
                        value={rule.startTime}
                        onChange={(event) =>
                          setMenuAutomation((current) => ({
                            ...current,
                            rules: current.rules.map((item) =>
                              item.id === rule.id ? { ...item, startTime: event.target.value } : item
                            ),
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Hasta</Label>
                      <Input
                        type="time"
                        value={rule.endTime}
                        onChange={(event) =>
                          setMenuAutomation((current) => ({
                            ...current,
                            rules: current.rules.map((item) =>
                              item.id === rule.id ? { ...item, endTime: event.target.value } : item
                            ),
                          }))
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 overflow-hidden rounded-md border">
                      {(["A", "B"] as const).map((variant) => (
                        <Button
                          key={variant}
                          type="button"
                          variant="ghost"
                          onClick={() =>
                            setMenuAutomation((current) => ({
                              ...current,
                              rules: current.rules.map((item) =>
                                item.id === rule.id ? { ...item, variant } : item
                              ),
                            }))
                          }
                          className="rounded-none"
                          style={{
                            backgroundColor: rule.variant === variant ? `hsl(${ui.adminAccent})` : undefined,
                            color: rule.variant === variant ? `hsl(${ui.adminCard})` : undefined,
                          }}
                        >
                          Carta {variant}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                style={{
                  backgroundColor: `hsl(${ui.adminCard})`,
                  color: `hsl(${ui.adminCardForeground})`,
                  borderColor: `hsl(${ui.adminCardForeground} / 0.3)`,
                }}
                onClick={() =>
                  setMenuAutomation((current) => ({
                    ...current,
                    rules: [
                      ...current.rules,
                      {
                        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                        days: [],
                        startTime: "10:00",
                        endTime: "17:00",
                        variant: current.defaultVariant === "A" ? "B" : "A",
                      },
                    ],
                  }))
                }
              >
                Agregar horario
              </Button>
            </div>
          )}

          <Button
            type="button"
            disabled={savingMenuAutomation}
            onClick={saveMenuAutomation}
            style={{ backgroundColor: `hsl(${ui.adminAccent})`, color: `hsl(${ui.adminCard})` }}
          >
            {savingMenuAutomation ? "Guardando..." : "Guardar automatización"}
          </Button>
        </CardContent>
      </Card>

      <Card
        className="mt-4 border-0 shadow-sm ring-1 ring-black/5"
        style={{
          backgroundColor: `hsl(${ui.adminCard})`,
          color: `hsl(${ui.adminCardForeground})`,
        }}
      >
        <CardContent className="p-4 sm:p-5">
          <div className="space-y-4">
            <div>
              <p className="font-semibold">Cómo funcionan Carta A y Carta B</p>
              <p className="mt-1 text-sm opacity-75">
                Las perillas indican en qué carta aparece cada item. Cada carta
                conserva su propio orden de categorías, subcategorías e items.
                El mismo QR siempre muestra la carta que figure como publicada.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Label className="text-sm font-semibold">Orden que estás editando:</Label>
              <div
                className="grid w-fit grid-cols-2 overflow-hidden rounded-md border"
                style={{ borderColor: `hsl(${ui.adminSidebarBg})` }}
                role="group"
                aria-label="Orden que estás editando"
              >
                {(["A", "B"] as const).map((variant) => {
                  const isSelected = orderMenuVariant === variant;

                  return (
                    <Button
                      key={variant}
                      type="button"
                      variant="ghost"
                      aria-pressed={isSelected}
                      onClick={() => setOrderMenuVariant(variant)}
                      className="rounded-none px-5 font-semibold hover:opacity-90"
                      style={{
                        backgroundColor: isSelected
                          ? `hsl(${ui.adminSidebarBg})`
                          : `hsl(${ui.adminCard})`,
                        color: isSelected
                          ? `hsl(${ui.adminSidebarText})`
                          : `hsl(${ui.adminSidebarBg})`,
                      }}
                    >
                      Carta {variant}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
        </div>
      )}

        <TabsContent value="items" className="mt-3 sm:mt-6">
          <Card
            className="w-full min-w-0 overflow-hidden border-0 shadow-sm ring-1 ring-black/5"
            style={{
              backgroundColor: `hsl(${ui.adminBackground})`,
              color: `hsl(${ui.adminCardForeground})`,
            }}
          >
            <CardHeader
              className="border-b p-4 sm:p-6"
              style={{
                backgroundColor: `hsl(${ui.adminBackground})`,
                color: `hsl(${ui.adminForeground})`,
                borderBottomColor: `hsl(${ui.adminAccent} / 0.18)`,
              }}
            >
              <CardTitle>Platos y Bebidas</CardTitle>
              <CardDescription>
                Cada item debe pertenecer a una categoría. Al arrastrar estás ordenando la Carta {orderMenuVariant}.
              </CardDescription>

              <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="grid w-full gap-3 lg:flex lg:items-center lg:gap-4">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Buscar:</Label>
                    <Input
                      className="h-9 w-full sm:w-52"
                      placeholder="Nombre o categoría..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Sección principal:</Label>
                    <select
                      className="h-9 w-full rounded-md border bg-background px-2 text-sm text-foreground sm:min-w-[220px]"
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
                      className="h-9 w-full rounded-md border bg-background px-2 text-sm text-foreground sm:w-auto"
                      value={sortMode}
                      onChange={(e) => setSortMode(e.target.value as any)}
                    >
                      <option value="manual">Manual</option>
                      <option value="auto">A-Z</option>
                    </select>
                  </div>
                </div>

                <div className="relative flex w-full flex-wrap items-center gap-3 lg:w-auto">
                  {isSavingItemsOrder && (
                    <span className="absolute -top-5 right-0 whitespace-nowrap text-xs text-muted-foreground">
                      Guardando orden de Carta {orderMenuVariant}…
                    </span>
                  )}

                  <MenuCsvImporter
                    tenantId={tenantId}
                    categories={categories}
                    currency={tenantCurrency}
                    onImported={reloadAll}
                  />

                  <Sheet open={createOpen} onOpenChange={setCreateOpen}>


                    <SheetContent className="sm:max-w-lg overflow-y-auto">
                      <SheetHeader>
                        <SheetTitle>Agregar Nuevo Item</SheetTitle>
                        <SheetDescription>
                          Completá los detalles del plato o bebida.
                        </SheetDescription>
                      </SheetHeader>

                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
                          <Label htmlFor="c-name" className="sm:text-right">
                            Nombre
                          </Label>
                          <div className="flex min-w-0 items-center gap-2 sm:col-span-3">
                            <Input
                              id="c-name"
                              className="min-w-0 flex-1"
                              value={createForm.name}
                              onChange={(e) => onChangeCreate("name", e.target.value)}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              title="Convertir a mayúsculas"
                              onClick={() =>
                                onChangeCreate(
                                  "name",
                                  createForm.name.toLocaleUpperCase("es-AR")
                                )
                              }
                              className="border-[hsl(var(--case-button-border))] bg-transparent px-3 text-[hsl(var(--case-button-text))] hover:bg-[hsl(var(--case-button-hover-bg))] hover:text-[hsl(var(--case-button-hover-text))]"
                              style={{
                                "--case-button-border": ui.adminForeground,
                                "--case-button-text": ui.adminForeground,
                                "--case-button-hover-bg": ui.adminAccent,
                                "--case-button-hover-text": ui.adminCard,
                              } as CSSProperties}
                            >
                              AA
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              title="Convertir a minúsculas"
                              onClick={() =>
                                onChangeCreate(
                                  "name",
                                  createForm.name.toLocaleLowerCase("es-AR")
                                )
                              }
                              className="border-[hsl(var(--case-button-border))] bg-transparent px-3 text-[hsl(var(--case-button-text))] hover:bg-[hsl(var(--case-button-hover-bg))] hover:text-[hsl(var(--case-button-hover-text))]"
                              style={{
                                "--case-button-border": ui.adminForeground,
                                "--case-button-text": ui.adminForeground,
                                "--case-button-hover-bg": ui.adminAccent,
                                "--case-button-hover-text": ui.adminCard,
                              } as CSSProperties}
                            >
                              aa
                            </Button>
                          </div>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
                          <Label htmlFor="c-description" className="sm:text-right">
                            Descripción
                          </Label>
                          <Textarea
                            id="c-description"
                            className="sm:col-span-3"
                            value={createForm.description}
                            onChange={(e) =>
                              onChangeCreate("description", e.target.value)
                            }
                          />
                        </div>

                        <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
                          <Label htmlFor="c-price" className="sm:text-right">
                            Precio ({tenantCurrency})
                          </Label>
                          <Input
                            id="c-price"
                            type="number"
                            className="sm:col-span-3"
                            value={createForm.price}
                            onChange={(e) =>
                              onChangeCreate("price", Number(e.target.value))
                            }
                          />
                        </div>

                        <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
                          <Label htmlFor="c-category" className="sm:text-right">
                            Categoría
                          </Label>
                          <select
                            id="c-category"
                            className="col-span-3 h-9 rounded-md border bg-background px-2 text-sm"
                            value={createForm.categoryId}
                            onChange={(e) =>
                              onChangeCreate("categoryId", e.target.value)
                            }
                          >
                            <option value="">Elegí una categoría…</option>
                            {categoryOptions.map((o) => (
                              <option key={o.id} value={o.id}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
                          <Label className="sm:text-right">
                            {settings?.specialLabel?.trim().slice(0, 15) || "Sugerencia"}
                          </Label>
                          <div className="sm:col-span-3">
                            <Switch
                              checked={!!createForm.isSpecial}
                              onCheckedChange={(checked) =>
                                setCreateForm((prev) => ({
                                  ...prev,
                                  isSpecial: checked,
                                }))
                              }
                            />
                          </div>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
                          <Label className="sm:text-right">Sin TACC</Label>
                          <div className="sm:col-span-3">
                            <Switch
                              checked={hasSinTacc(createForm.tags)}
                              onCheckedChange={(checked) =>
                                setCreateForm((prev) => ({
                                  ...prev,
                                  tags: withSinTacc(prev.tags, checked),
                                }))
                              }
                            />
                          </div>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-4 sm:items-start sm:gap-4">
                          <Label className="pt-2 sm:text-right">Imagen</Label>
                          <div className="space-y-3 sm:col-span-3">
                            <input
                              ref={createImageInputRef}
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              className="hidden"
                              onChange={(e) => selectCreateImage(e.target.files?.[0] ?? null)}
                            />
                            <button
                              type="button"
                              onClick={() => createImageInputRef.current?.click()}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => {
                                e.preventDefault();
                                selectCreateImage(e.dataTransfer.files?.[0] ?? null);
                              }}
                              className="flex min-h-28 w-full items-center justify-center overflow-hidden rounded-md border-2 border-dashed p-3 transition-colors hover:bg-black/5"
                            >
                              {createImagePreview ? (
                                <img
                                  src={createImagePreview}
                                  alt="Vista previa"
                                  className="h-24 w-24 rounded-md object-cover"
                                />
                              ) : (
                                <span className="flex items-center gap-2 text-sm">
                                  <ImagePlus className="h-5 w-5" />
                                  Elegir o arrastrar imagen
                                </span>
                              )}
                            </button>
                            <p className="text-xs opacity-70">
                              Recomendado: 1200 × 900 px, JPG o WebP, hasta 500 KB.
                            </p>
                            {createImagePreview && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (createImagePreview.startsWith("blob:")) {
                                    URL.revokeObjectURL(createImagePreview);
                                  }
                                  setCreateImageFile(null);
                                  setCreateImagePreview("");
                                  setCreateForm((prev) => ({ ...prev, imageUrl: "" }));
                                  if (createImageInputRef.current) {
                                    createImageInputRef.current.value = "";
                                  }
                                }}
                              >
                                <X className="mr-2 h-4 w-4" />
                                Quitar
                              </Button>
                            )}
                            <div className="flex items-center justify-between rounded-md border p-3">
                              <Label htmlFor="c-show-image">Mostrar imagen en la carta</Label>
                              <Switch
                                id="c-show-image"
                                checked={createForm.showImage ?? true}
                                onCheckedChange={(checked) =>
                                  onChangeCreate("showImage", checked)
                                }
                              />
                            </div>
                          </div>
                        </div>
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

            <CardContent
              className="rounded-t-lg px-4 pb-4 pt-5 sm:px-6 sm:pb-6 sm:pt-6"
              style={{ backgroundColor: `hsl(${ui.adminCard})` }}
            >
              {loading ? (
                <p>Cargando platos...</p>
              ) : (
                <div className="w-full min-w-0 overflow-x-auto overscroll-x-contain">
                  <div className="min-w-[680px] overflow-hidden rounded-md">
                    <Table>
                      <TableHeader
                        style={{
                          "--table-head-bg": ui.adminSidebarBg,
                          "--table-head-text": ui.adminSidebarText,
                        } as CSSProperties}
                      >
                        <TableRow className="border-0 bg-[hsl(var(--table-head-bg))] hover:bg-[hsl(var(--table-head-bg))]">
                          <TableHead className="w-[80px] rounded-tl-md text-[hsl(var(--table-head-text))]">Imagen</TableHead>
                          <TableHead className="text-[hsl(var(--table-head-text))]">Nombre</TableHead>
                          <TableHead className="text-[hsl(var(--table-head-text))]">Categoría</TableHead>
                          <TableHead className="text-[hsl(var(--table-head-text))]">Precio</TableHead>
                          <TableHead className="text-[hsl(var(--table-head-text))]">Visible</TableHead>
                          <TableHead className="text-[hsl(var(--table-head-text))]">Carta A</TableHead>
                          <TableHead className="text-[hsl(var(--table-head-text))]">Carta B</TableHead>
                          <TableHead className="w-[100px] rounded-tr-md text-[hsl(var(--table-head-text))]">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {sortedItems.map((item) => {
                          const category = categories.find((c) => c.id === item.categoryId);
                          const parentId = getItemParentId(item);
                          const parentName = parentId
                            ? categoryById.get(parentId)?.name
                            : undefined;

                          const placeholder = PlaceHolderImages.find((p) => p.id === item.imageId);
                          const imageUrl = item.imageUrl || placeholder?.imageUrl || "";

                          return (
                            <TableRow
                              key={item.id}
                              className="group transition-colors hover:bg-[hsl(var(--row-hover-bg))] hover:text-[hsl(var(--row-hover-text))]"
                              style={{
                                "--row-hover-bg": `${ui.adminSidebarBg} / 0.08`,
                                "--row-hover-text": ui.adminCardForeground,
                              } as CSSProperties}
                              draggable={sortMode === "manual"}
                              onDragStart={() => handleDragItemStart(item)}
                              onDragOver={(e) => handleDragItemOver(e, item)}
                              onDragEnd={handleDragItemEnd}
                            >
                              <TableCell>
                                {imageUrl && (
                                  <Image
                                    src={imageUrl}
                                    alt={item.name}
                                    width={50}
                                    height={50}
                                    className={`h-[50px] w-[50px] rounded-md object-cover ${
                                      item.showImage === false ? "opacity-35" : ""
                                    }`}
                                  />
                                )}
                              </TableCell>

                              <TableCell className="font-medium">
                                {item.name}
                              </TableCell>

                              <TableCell>
                                {parentName && category?.parentCategoryId ? (
                                  <span className="text-sm">
                                    <span className="text-muted-foreground group-hover:text-[hsl(var(--row-hover-text))]">
                                      {parentName}
                                    </span>
                                    <span className="text-muted-foreground group-hover:text-[hsl(var(--row-hover-text))]"> {" > "} </span>
                                    <span>{category?.name}</span>
                                  </span>
                                ) : (
                                  <span>{category?.name}</span>
                                )}
                              </TableCell>

                              <TableCell>
                                {formatCurrency(item.price, tenantCurrency)}
                              </TableCell>

                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  title={item.isVisible ? "Ocultar item" : "Mostrar item"}
                                  aria-label={item.isVisible ? `Ocultar ${item.name}` : `Mostrar ${item.name}`}
                                  aria-pressed={!!item.isVisible}
                                  onClick={() =>
                                    handleToggleItem(item.id, "isVisible", !item.isVisible)
                                  }
                                  className={
                                    item.isVisible
                                      ? "text-[hsl(var(--visible-eye-color))] hover:bg-[hsl(var(--visible-eye-color))] hover:text-white"
                                      : "text-muted-foreground opacity-55 hover:bg-[hsl(var(--visible-eye-color))] hover:text-white hover:opacity-100"
                                  }
                                  style={{
                                    "--visible-eye-color": ui.adminAccent,
                                  } as CSSProperties}
                                >
                                  {item.isVisible ? (
                                    <Eye className="h-5 w-5" />
                                  ) : (
                                    <EyeOff className="h-5 w-5" />
                                  )}
                                </Button>
                              </TableCell>

                              <TableCell>
                                <Switch
                                  checked={(item.menuVariants ?? ["A"]).includes("A")}
                                  onCheckedChange={(value) =>
                                    handleToggleMenuVariant(item, "A", value)
                                  }
                                  aria-label={`${item.name} en Carta A`}
                                />
                              </TableCell>
                              <TableCell>
                                <Switch
                                  checked={(item.menuVariants ?? ["A"]).includes("B")}
                                  onCheckedChange={(value) =>
                                    handleToggleMenuVariant(item, "B", value)
                                  }
                                  aria-label={`${item.name} en Carta B`}
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
                                    className="text-[hsl(var(--delete-color))] transition-colors hover:bg-[hsl(var(--delete-color))] hover:text-[hsl(var(--delete-hover-text))]"
                                    style={{
                                      "--delete-color": ui.adminDelete,
                                      "--delete-hover-text": ui.adminCard,
                                    } as CSSProperties}
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
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Sheet open={editOpen} onOpenChange={setEditOpen}>
            <SheetContent className="sm:max-w-lg overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Editar Item</SheetTitle>
                <SheetDescription>Actualizá los datos del plato o bebida.</SheetDescription>
              </SheetHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
                  <Label htmlFor="e-name" className="sm:text-right">
                    Nombre
                  </Label>
                  <div className="flex min-w-0 items-center gap-2 sm:col-span-3">
                    <Input
                      id="e-name"
                      className="min-w-0 flex-1"
                      value={editForm.name}
                      onChange={(e) => onChangeEdit("name", e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      title="Convertir a mayúsculas"
                      onClick={() =>
                        onChangeEdit(
                          "name",
                          editForm.name.toLocaleUpperCase("es-AR")
                        )
                      }
                      className="border-[hsl(var(--case-button-border))] bg-transparent px-3 text-[hsl(var(--case-button-text))] hover:bg-[hsl(var(--case-button-hover-bg))] hover:text-[hsl(var(--case-button-hover-text))]"
                      style={{
                        "--case-button-border": ui.adminForeground,
                        "--case-button-text": ui.adminForeground,
                        "--case-button-hover-bg": ui.adminAccent,
                        "--case-button-hover-text": ui.adminCard,
                      } as CSSProperties}
                    >
                      AA
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      title="Convertir a minúsculas"
                      onClick={() =>
                        onChangeEdit(
                          "name",
                          editForm.name.toLocaleLowerCase("es-AR")
                        )
                      }
                      className="border-[hsl(var(--case-button-border))] bg-transparent px-3 text-[hsl(var(--case-button-text))] hover:bg-[hsl(var(--case-button-hover-bg))] hover:text-[hsl(var(--case-button-hover-text))]"
                      style={{
                        "--case-button-border": ui.adminForeground,
                        "--case-button-text": ui.adminForeground,
                        "--case-button-hover-bg": ui.adminAccent,
                        "--case-button-hover-text": ui.adminCard,
                      } as CSSProperties}
                    >
                      aa
                    </Button>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
                  <Label htmlFor="e-description" className="sm:text-right">
                    Descripción
                  </Label>
                  <Textarea
                    id="e-description"
                    className="sm:col-span-3"
                    value={editForm.description}
                    onChange={(e) => onChangeEdit("description", e.target.value)}
                  />
                </div>

                <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
                  <Label htmlFor="e-price" className="sm:text-right">
                    Precio ({tenantCurrency})
                  </Label>
                  <Input
                    id="e-price"
                    type="number"
                    className="sm:col-span-3"
                    value={editForm.price}
                    onChange={(e) => onChangeEdit("price", Number(e.target.value))}
                  />
                </div>

                <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
                  <Label htmlFor="e-category" className="sm:text-right">
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

                <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
                  <Label className="sm:text-right">
                    {settings?.specialLabel?.trim().slice(0, 15) || "Sugerencia"}
                  </Label>
                  <div className="sm:col-span-3">
                    <Switch
                      checked={!!editForm.isSpecial}
                      onCheckedChange={(checked) =>
                        setEditForm((prev) => ({
                          ...prev,
                          isSpecial: checked,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
                  <Label className="sm:text-right">Sin TACC</Label>
                  <div className="sm:col-span-3">
                    <Switch
                      checked={hasSinTacc(editForm.tags)}
                      onCheckedChange={(checked) =>
                        setEditForm((prev) => ({
                          ...prev,
                          tags: withSinTacc(prev.tags, checked),
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-4 sm:items-start sm:gap-4">
                  <Label className="pt-2 sm:text-right">Imagen</Label>
                  <div className="space-y-3 sm:col-span-3">
                    <input
                      ref={editImageInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => selectEditImage(e.target.files?.[0] ?? null)}
                    />
                    <button
                      type="button"
                      onClick={() => editImageInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        selectEditImage(e.dataTransfer.files?.[0] ?? null);
                      }}
                      className="flex min-h-28 w-full items-center justify-center overflow-hidden rounded-md border-2 border-dashed p-3 transition-colors hover:bg-black/5"
                    >
                      {editImagePreview ? (
                        <img
                          src={editImagePreview}
                          alt="Vista previa"
                          className="h-24 w-24 rounded-md object-cover"
                        />
                      ) : (
                        <span className="flex items-center gap-2 text-sm">
                          <ImagePlus className="h-5 w-5" />
                          Elegir o arrastrar imagen
                        </span>
                      )}
                    </button>
                    <p className="text-xs opacity-70">
                      Recomendado: 1200 × 900 px, JPG o WebP, hasta 500 KB.
                    </p>
                    {editImagePreview && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (editImagePreview.startsWith("blob:")) {
                            URL.revokeObjectURL(editImagePreview);
                          }
                          setEditImageFile(null);
                          setEditImagePreview("");
                          setEditForm((prev) => ({
                            ...prev,
                            imageUrl: "",
                            imageId: "",
                          }));
                          if (editImageInputRef.current) {
                            editImageInputRef.current.value = "";
                          }
                        }}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Quitar
                      </Button>
                    )}
                    <div className="flex items-center justify-between rounded-md border p-3">
                      <Label htmlFor="e-show-image">Mostrar imagen en la carta</Label>
                      <Switch
                        id="e-show-image"
                        checked={editForm.showImage ?? true}
                        onCheckedChange={(checked) =>
                          onChangeEdit("showImage", checked)
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <SheetFooter>
                <SheetClose asChild>
                  <Button
                    type="button"
                    onClick={handleUpdateItem}
                    disabled={!editId}
                    className="transition-transform active:translate-y-0.5 active:scale-[0.98]"
                    style={{
                      backgroundColor: `hsl(${ui.navBg})`,
                      color: `hsl(${ui.navText})`,
                    }}
                  >
                    Guardar Cambios
                  </Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </TabsContent>

        <TabsContent value="categories" className="mt-3 sm:mt-6">
          <Card
            className="w-full min-w-0 overflow-hidden border-0 shadow-sm ring-1 ring-black/5"
            style={{
              backgroundColor: `hsl(${ui.adminCard})`,
              color: `hsl(${ui.adminCardForeground})`,
            }}
          >
            <CardHeader
              className="border-b p-4 sm:p-6"
              style={{
                backgroundColor: `hsl(${ui.adminBackground})`,
                color: `hsl(${ui.adminForeground})`,
                borderBottomColor: `hsl(${ui.adminAccent} / 0.18)`,
              }}
            >
              <CardTitle>Categorías del Menú</CardTitle>
              <CardDescription className="space-y-1">
                <span className="block">
                  Creá y ordená las secciones de la Carta {orderMenuVariant}.
                </span>
                <span className="block">
                  Creá primero una categoría. Después pasá a Items del Menú para
                  agregar los platos o productos.
                </span>
                <span className="flex items-start gap-2">
                  <EyeOff className="mt-0.5 h-4 w-4 shrink-0" />
                  Podés ocultar una categoría completa o esconder solamente los
                  items que quieras usando sus controles de visibilidad.
                </span>
              </CardDescription>
            </CardHeader>

            <CardContent className="px-4 pb-4 pt-5 sm:px-6 sm:pb-6 sm:pt-5">
              <div className="mb-4 flex flex-wrap items-end gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="new-cat-name">Nombre</Label>
                  <div className="flex min-w-0 items-center gap-2">
                    <Input
                      id="new-cat-name"
                      className="min-w-0 flex-1"
                      placeholder="Ej: Entradas"
                      value={formCatName}
                      onChange={(e) => setFormCatName(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      title="Convertir a mayúsculas"
                      onClick={() =>
                        setFormCatName(formCatName.toLocaleUpperCase("es-AR"))
                      }
                      className="border-[hsl(var(--case-button-border))] bg-transparent px-3 text-[hsl(var(--case-button-text))] hover:bg-[hsl(var(--case-button-hover-bg))] hover:text-[hsl(var(--case-button-hover-text))]"
                      style={{
                        "--case-button-border": ui.adminForeground,
                        "--case-button-text": ui.adminForeground,
                        "--case-button-hover-bg": ui.adminAccent,
                        "--case-button-hover-text": ui.adminCard,
                      } as CSSProperties}
                    >
                      AA
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      title="Convertir a minúsculas"
                      onClick={() =>
                        setFormCatName(formCatName.toLocaleLowerCase("es-AR"))
                      }
                      className="border-[hsl(var(--case-button-border))] bg-transparent px-3 text-[hsl(var(--case-button-text))] hover:bg-[hsl(var(--case-button-hover-bg))] hover:text-[hsl(var(--case-button-hover-text))]"
                      style={{
                        "--case-button-border": ui.adminForeground,
                        "--case-button-text": ui.adminForeground,
                        "--case-button-hover-bg": ui.adminAccent,
                        "--case-button-hover-text": ui.adminCard,
                      } as CSSProperties}
                    >
                      aa
                    </Button>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="new-cat-parent">Sección principal</Label>
                  <select
                    id="new-cat-parent"
                    className="h-9 rounded-md border bg-background px-2 text-sm text-foreground min-w-[180px]"
                    value={formCatParentId}
                    onChange={(e) => setFormCatParentId(e.target.value)}
                  >
                    <option value="">Ninguna (sección principal)</option>
                    {sortedRootCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2">
                  <Label className="invisible">.</Label>
                  <Button
                    onClick={onCreateCategory}
                    className="border border-[hsl(var(--tenant-button-border))] bg-[hsl(var(--tenant-button-bg))] text-[hsl(var(--tenant-button-text))] hover:border-[hsl(var(--tenant-button-hover-bg))] hover:bg-[hsl(var(--tenant-button-hover-bg))] hover:text-[hsl(var(--tenant-button-hover-text))]"
                    style={{
                      "--tenant-button-bg": ui.adminCardForeground,
                      "--tenant-button-text": ui.adminCard,
                      "--tenant-button-border": ui.adminCardForeground,
                      "--tenant-button-hover-bg": ui.adminAccent,
                      "--tenant-button-hover-text": ui.adminCard,
                    } as CSSProperties}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Crear
                  </Button>
                </div>
              </div>

              {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aún no hay categorías.
                </p>
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
                          <div className="flex w-full items-center gap-3 lg:w-auto">
                            {openParents[parent.id] ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}

                            <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                            <span className="font-semibold">{parent.name}</span>

                            {isSavingOrder && (
                              <span className="text-xs text-muted-foreground">
                                Guardando…
                              </span>
                            )}
                          </div>

                          <div
                            className="flex items-center gap-4"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              title={parent.isVisible ? "Ocultar categoría" : "Mostrar categoría"}
                              aria-label={parent.isVisible ? `Ocultar ${parent.name}` : `Mostrar ${parent.name}`}
                              aria-pressed={parent.isVisible}
                              onClick={() => onToggleCategoryVisible(parent, !parent.isVisible)}
                              className={parent.isVisible
                                ? "text-[hsl(var(--visible-eye-color))] hover:bg-[hsl(var(--visible-eye-color))] hover:text-white"
                                : "text-muted-foreground opacity-55 hover:bg-[hsl(var(--visible-eye-color))] hover:text-white hover:opacity-100"}
                              style={{ "--visible-eye-color": ui.adminAccent } as CSSProperties}
                            >
                              {parent.isVisible ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                            </Button>
                            {(["A", "B"] as MenuVariant[]).map((variant) => (
                              <label key={variant} className="flex items-center gap-1">
                                <span className="text-xs font-semibold">{variant}</span>
                                <Switch
                                  checked={(parent.menuVariants ?? ["A", "B"]).includes(variant)}
                                  onCheckedChange={(enabled) => onToggleCategoryVariant(parent, variant, enabled)}
                                  aria-label={`${parent.name} en Carta ${variant}`}
                                />
                              </label>
                            ))}

                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => startEditCategory(parent)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-[hsl(var(--delete-color))] transition-colors hover:bg-[hsl(var(--delete-color))] hover:text-[hsl(var(--delete-hover-text))]"
                                    style={{
                                      "--delete-color": ui.adminDelete,
                                      "--delete-hover-text": ui.adminCard,
                                    } as CSSProperties}
                                onClick={() => onDeleteCategory(parent)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {openParents[parent.id] &&
                          children.map((child, childIndex) => (
                            <div
                              key={child.id}
                              className="ml-8 flex cursor-grab items-center justify-between rounded-md border border-border/40 bg-secondary/60 p-3 active:cursor-grabbing"
                              draggable
                              onDragStart={() =>
                                handleChildDragStart(parent.id, childIndex)
                              }
                              onDragOver={(e) =>
                                handleChildDragOver(e, parent.id, childIndex)
                              }
                              onDragEnd={() => handleChildDragEnd(parent.id)}
                            >
                              <div className="flex w-full items-center gap-3 lg:w-auto">
                                <span className="text-muted-foreground">↳</span>
                                <GripVertical className="h-5 w-5 text-muted-foreground" />
                                <span className="font-medium">{child.name}</span>
                              </div>

                              <div className="flex items-center gap-4">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  title={child.isVisible ? "Ocultar categoría" : "Mostrar categoría"}
                                  aria-label={child.isVisible ? `Ocultar ${child.name}` : `Mostrar ${child.name}`}
                                  aria-pressed={child.isVisible}
                                  onClick={() => onToggleCategoryVisible(child, !child.isVisible)}
                                  className={child.isVisible
                                    ? "text-[hsl(var(--visible-eye-color))] hover:bg-[hsl(var(--visible-eye-color))] hover:text-white"
                                    : "text-muted-foreground opacity-55 hover:bg-[hsl(var(--visible-eye-color))] hover:text-white hover:opacity-100"}
                                  style={{ "--visible-eye-color": ui.adminAccent } as CSSProperties}
                                >
                                  {child.isVisible ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                                </Button>
                                {(["A", "B"] as MenuVariant[]).map((variant) => (
                                  <label key={variant} className="flex items-center gap-1">
                                    <span className="text-xs font-semibold">{variant}</span>
                                    <Switch
                                      checked={(child.menuVariants ?? ["A", "B"]).includes(variant)}
                                      onCheckedChange={(enabled) => onToggleCategoryVariant(child, variant, enabled)}
                                      aria-label={`${child.name} en Carta ${variant}`}
                                    />
                                  </label>
                                ))}

                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => startEditCategory(child)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>

                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-[hsl(var(--delete-color))] transition-colors hover:bg-[hsl(var(--delete-color))] hover:text-[hsl(var(--delete-hover-text))]"
                                    style={{
                                      "--delete-color": ui.adminDelete,
                                      "--delete-hover-text": ui.adminCard,
                                    } as CSSProperties}
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
                    <SheetDescription>
                      Modificá el nombre o la visibilidad.
                    </SheetDescription>
                  </SheetHeader>

                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
                      <Label htmlFor="cat-name" className="sm:text-right">
                        Nombre
                      </Label>
                      <div className="flex min-w-0 items-center gap-2 sm:col-span-3">
                        <Input
                          id="cat-name"
                          className="min-w-0 flex-1"
                          value={catForm.name}
                          onChange={(e) =>
                            setCatForm((p) => ({ ...p, name: e.target.value }))
                          }
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          title="Convertir a mayúsculas"
                          onClick={() =>
                            setCatForm((p) => ({
                              ...p,
                              name: p.name.toLocaleUpperCase("es-AR"),
                            }))
                          }
                          className="border-[hsl(var(--case-button-border))] bg-transparent px-3 text-[hsl(var(--case-button-text))] hover:bg-[hsl(var(--case-button-hover-bg))] hover:text-[hsl(var(--case-button-hover-text))]"
                          style={{
                            "--case-button-border": ui.adminForeground,
                            "--case-button-text": ui.adminForeground,
                            "--case-button-hover-bg": ui.adminAccent,
                            "--case-button-hover-text": ui.adminCard,
                          } as CSSProperties}
                        >
                          AA
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          title="Convertir a minúsculas"
                          onClick={() =>
                            setCatForm((p) => ({
                              ...p,
                              name: p.name.toLocaleLowerCase("es-AR"),
                            }))
                          }
                          className="border-[hsl(var(--case-button-border))] bg-transparent px-3 text-[hsl(var(--case-button-text))] hover:bg-[hsl(var(--case-button-hover-bg))] hover:text-[hsl(var(--case-button-hover-text))]"
                          style={{
                            "--case-button-border": ui.adminForeground,
                            "--case-button-text": ui.adminForeground,
                            "--case-button-hover-bg": ui.adminAccent,
                            "--case-button-hover-text": ui.adminCard,
                          } as CSSProperties}
                        >
                          aa
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
                      <Label htmlFor="cat-description" className="sm:text-right">
                        Descripción
                      </Label>
                      <Input
                        id="cat-description"
                        className="sm:col-span-3"
                        value={catForm.description}
                        onChange={(e) =>
                          setCatForm((p) => ({ ...p, description: e.target.value }))
                        }
                      />
                    </div>

                    <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
                      <Label htmlFor="cat-parent" className="sm:text-right">
                        Sección principal
                      </Label>
                      <select
                        id="cat-parent"
                        className="col-span-3 h-9 rounded-md border bg-background px-2 text-sm"
                        value={catForm.parentCategoryId ?? ""}
                        onChange={(e) =>
                          setCatForm((p) => ({
                            ...p,
                            parentCategoryId: e.target.value || null,
                          }))
                        }
                      >
                        <option value="">Ninguna (sección principal)</option>
                        {sortedRootCategories
                          .filter((c) => c.id !== catEditingId)
                          .map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
                      <Label className="sm:text-right">Visible</Label>
                      <div className="sm:col-span-3">
                        <Switch
                          checked={catForm.isVisible}
                          onCheckedChange={(isVisible) =>
                            setCatForm((previous) => ({ ...previous, isVisible }))
                          }
                        />
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
                      <Label className="sm:text-right">Cartas</Label>
                      <div className="flex gap-3 sm:col-span-3">
                        {(["A", "B"] as MenuVariant[]).map((variant) => (
                          <label key={variant} className="flex items-center gap-2">
                            <Switch
                              checked={catForm.menuVariants.includes(variant)}
                              onCheckedChange={(enabled) =>
                                setCatForm((previous) => ({
                                  ...previous,
                                  menuVariants: enabled
                                    ? Array.from(
                                        new Set([...previous.menuVariants, variant])
                                      )
                                    : previous.menuVariants.filter(
                                        (entry) => entry !== variant
                                      ),
                                }))
                              }
                            />
                            Carta {variant}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <SheetFooter>
                    <SheetClose asChild>
                      <Button variant="secondary">Cancelar</Button>
                    </SheetClose>

                    <Button
                      onClick={saveCategoryEdit}
                      style={{
                        backgroundColor: `hsl(${ui.navBg})`,
                        color: `hsl(${ui.navText})`,
                      }}
                    >
                      Guardar
                    </Button>
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

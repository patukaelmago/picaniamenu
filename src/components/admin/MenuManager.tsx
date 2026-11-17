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
  where,
  writeBatch,
} from "firebase/firestore";

import { useTenantUI } from "@/hooks/use-tenant-ui";
import { useRestaurantSettings } from "@/hooks/use-restaurant-settings";
import MenuCsvImporter from "@/components/admin/MenuCsvImporter";

import { db, storage } from "@/lib/firebase";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { prepareImageForUpload } from "@/lib/compress-image";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  CalendarDays,
  ImagePlus,
  X,
  Camera,
  CheckCircle2,
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

const getTodayInArgentina = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
};

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

const plural = (n: number, singular: string, pluralForm: string) =>
  `${n} ${n === 1 ? singular : pluralForm}`;

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

const isVisibleInMenu = (
  entry: { isVisible: boolean; menuVariants?: MenuVariant[] },
  variant: MenuVariant,
  defaultVariants: MenuVariant[]
) =>
  entry.isVisible !== false &&
  (entry.menuVariants ?? defaultVariants).includes(variant);

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
  const [categoryToDelete, setCategoryToDelete] = useState<{
    category: Category;
    subcategories: Category[];
    items: { id: string; imageUrl: string }[];
  } | null>(null);
  const [deletingCategory, setDeletingCategory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tenantName, setTenantName] = useState("");
  // Si el color de "eliminar" es igual al de los botones normales, se usa rojo
  // para que borrar no se confunda con otras acciones.
  const deleteColor =
    ui.adminDelete.replace(/\s+/g, " ").trim() === ui.adminAccent.replace(/\s+/g, " ").trim()
      ? "0 72% 51%"
      : ui.adminDelete;
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);
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
  const [recentlyAddedRuleId, setRecentlyAddedRuleId] = useState<string | null>(null);

  useEffect(() => {
    if (!recentlyAddedRuleId) return;

    const scrollTimer = window.setTimeout(() => {
      document
        .getElementById(`automation-rule-${recentlyAddedRuleId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
    const highlightTimer = window.setTimeout(() => setRecentlyAddedRuleId(null), 2500);

    return () => {
      window.clearTimeout(scrollTimer);
      window.clearTimeout(highlightTimer);
    };
  }, [recentlyAddedRuleId]);

  const [formCatName, setFormCatName] = useState("");
  const [formCatParentId, setFormCatParentId] = useState<string>("");
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);
  const [categorySearchTerm, setCategorySearchTerm] = useState("");

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
  const [savingItem, setSavingItem] = useState(false);
  const [createForm, setCreateForm] = useState<MenuItemInput>(emptyItem);
  // El precio del plato nuevo arranca vacío (no en 0) para no guardar platos a $0 por olvido.
  const [createPriceText, setCreatePriceText] = useState("");
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
    const nextMenuAutomation = {
      ...menuAutomation,
      enabled: false,
      defaultVariant: next,
    };
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
        (rule) =>
          (rule.date !== undefined
            ? !/^\d{4}-\d{2}-\d{2}$/.test(rule.date)
            : rule.days.length === 0) || rule.startTime === rule.endTime
      )
    ) {
      toast({
        variant: "destructive",
        title: "Revisá los horarios",
        description: "Cada programación debe tener días o fecha elegidos y horas diferentes.",
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
    const current = item.isVisible === false ? [] : item.menuVariants ?? ["A"];
    const menuVariants = enabled
      ? Array.from(new Set([...current, variant]))
      : current.filter((value) => value !== variant);
    const isVisible = enabled ? true : item.isVisible;
  
    setItems((prev) =>
      prev.map((entry) =>
        entry.id === item.id ? { ...entry, menuVariants, isVisible } : entry
      )
    );
  
    try {
      await updateDoc(doc(itemsCol, item.id), {
        menuVariants,
        isVisible,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error(e);
      setItems((prev) =>
        prev.map((entry) =>
          entry.id === item.id
            ? {
                ...entry,
                menuVariants: item.menuVariants,
                isVisible: item.isVisible,
              }
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
    const prepared = await prepareImageForUpload(file, "photo");
    const safeName = norm(itemName).replace(/[^a-z0-9]+/g, "-") || "item";
    const imageRef = ref(
      storage,
      `tenants/${tenantId}/menu-items/${safeName}-${Date.now()}.${prepared.ext}`
    );
    await uploadBytes(imageRef, prepared.file, prepared.metadata);
    return getDownloadURL(imageRef);
  }

  // Borra de Storage una foto que ya no se usa. Solo toca fotos de este restaurante
  // y solo si ningún otro producto usa la misma imagen. Si falla, no frena nada.
  async function deleteImageIfUnused(url: string | undefined, exceptItemId?: string) {
    if (!url || !url.includes("firebasestorage")) return;
    if (!url.includes(`/o/tenants%2F${encodeURIComponent(tenantId)}%2F`)) return;

    try {
      const snap = await getDocs(query(itemsCol, where("imageUrl", "==", url)));
      if (snap.docs.some((d) => d.id !== exceptItemId)) return;
      await deleteObject(ref(storage, url));
    } catch (e) {
      console.warn("No se pudo borrar la foto vieja:", e);
    }
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

  const createMissing = [
    !createForm.name.trim() && "el nombre",
    createPriceText.trim() === "" && "el precio",
    !createForm.categoryId && "la categoría",
  ].filter(Boolean) as string[];

  async function handleCreateItem(addAnother = false) {
    if (savingItem) return;
    setSavingItem(true);
    try {
      const imageUrl = createImageFile
        ? await uploadItemImage(createImageFile, createForm.name)
        : createForm.imageUrl;
  
      // El plato nuevo va al final de su categoría, en las dos cartas.
      const sameCategory = items.filter((i) => i.categoryId === createForm.categoryId);
      const nextOrder = (values: number[]) =>
        values.length === 0 ? 0 : Math.max(...values) + 1;
      const nextA = nextOrder(sameCategory.map((i) => getMenuOrder(i, "A")));
      const nextB = nextOrder(sameCategory.map((i) => getMenuOrder(i, "B")));

      await addDoc(itemsCol, {
        ...createForm,
        menuVariants: [orderMenuVariant],
        currency: tenantCurrency,
        imageUrl,
        imageId: "",
        order: nextA,
        orderA: nextA,
        orderB: nextB,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
  
      toast({
        title: "Plato creado",
        description: addAnother ? "Podés cargar el siguiente." : undefined,
      });
      const keptCategoryId = createForm.categoryId;
      setCreatePriceText("");
      setCreateForm(
        addAnother
          ? { ...emptyItem, currency: tenantCurrency, categoryId: keptCategoryId }
          : emptyItem
      );
  
      if (createImagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(createImagePreview);
      }
  
      setCreateImageFile(null);
      setCreateImagePreview("");
      if (createImageInputRef.current) createImageInputRef.current.value = "";
      if (addAnother) {
        window.setTimeout(() => document.getElementById("c-name")?.focus(), 50);
      } else {
        setCreateOpen(false);
      }
      await loadItems();
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear el plato. Lo que cargaste sigue en el formulario, probá de nuevo.",
      });
    } finally {
      setSavingItem(false);
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
    if (!editId || savingItem) return;
    setSavingItem(true);
    try {
      const imageUrl = editImageFile
        ? await uploadItemImage(editImageFile, editForm.name)
        : editForm.imageUrl;
  
      const previousImageUrl = items.find((i) => i.id === editId)?.imageUrl;
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
  
      if (previousImageUrl && previousImageUrl !== imageUrl) {
        await deleteImageIfUnused(previousImageUrl, editId);
      }

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
        description: "No se pudieron guardar los cambios. Siguen en el formulario, probá de nuevo.",
      });
    } finally {
      setSavingItem(false);
    }
  }

  async function handleDeleteItem(id: string) {
  
    try {
      const imageUrl = items.find((i) => i.id === id)?.imageUrl;
      await deleteDoc(doc(itemsCol, id));
      await deleteImageIfUnused(imageUrl, id);
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
      menuVariants: [orderMenuVariant],
      parentCategoryId: formCatParentId || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    setFormCatName("");
    setFormCatParentId("");
    setCreateCategoryOpen(false);
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

function openCreateItemIn(categoryId: string) {
  setCreateForm({ ...emptyItem, currency: tenantCurrency, categoryId });
  setCreatePriceText("");
  setActiveMenuTab("items");
  setCreateOpen(true);
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

  async function onToggleCategoryVariant(
    cat: Category,
    variant: MenuVariant,
    enabled: boolean
  ) {
    const current = cat.isVisible === false
      ? []
      : cat.menuVariants ?? ["A", "B"];
    const menuVariants = enabled
      ? Array.from(new Set([...current, variant]))
      : current.filter((entry) => entry !== variant);
    const isVisible = enabled ? true : cat.isVisible;
    setCategories((prev) =>
      prev.map((c) =>
        c.id === cat.id ? { ...c, menuVariants, isVisible } : c
      )
    );

    try {
      await updateDoc(doc(catsCol, cat.id), {
        menuVariants,
        isVisible,
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

  // Paso 1: junta subcategorías y productos y abre la advertencia.
  async function onDeleteCategory(cat: Category) {
    try {
      const subcategories = categories.filter((c) => c.parentCategoryId === cat.id);
      const categoryIds = [cat.id, ...subcategories.map((c) => c.id)];

      // Se consulta la base (no solo lo cargado en pantalla) para no dejar productos huérfanos.
      const found: { id: string; imageUrl: string }[] = [];
      for (let i = 0; i < categoryIds.length; i += 30) {
        const snap = await getDocs(
          query(itemsCol, where("categoryId", "in", categoryIds.slice(i, i + 30)))
        );
        snap.docs.forEach((d) =>
          found.push({ id: d.id, imageUrl: String(d.data().imageUrl ?? "") })
        );
      }

      setCategoryToDelete({ category: cat, subcategories, items: found });
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo preparar la eliminación de la categoría.",
      });
    }
  }

  // Paso 2: el usuario confirmó; se borra todo junto.
  async function confirmDeleteCategory() {
    if (!categoryToDelete || deletingCategory) return;
    const { category, subcategories, items: itemsToDelete } = categoryToDelete;
    const categoryIds = [category.id, ...subcategories.map((c) => c.id)];
    const refsToDelete = [
      ...itemsToDelete.map((item) => doc(itemsCol, item.id)),
      ...subcategories.map((c) => doc(catsCol, c.id)),
      doc(catsCol, category.id),
    ];

    setDeletingCategory(true);
    try {
      // Firestore permite hasta 500 operaciones por lote.
      for (let i = 0; i < refsToDelete.length; i += 450) {
        const batch = writeBatch(db);
        refsToDelete.slice(i, i + 450).forEach((r) => batch.delete(r));
        await batch.commit();
      }

      // Borra las fotos subidas a Storage que ya no usa ningún otro producto.
      for (const url of new Set(itemsToDelete.map((item) => item.imageUrl))) {
        await deleteImageIfUnused(url);
      }

      const deletedItemIds = new Set(itemsToDelete.map((item) => item.id));
      setCategories((prev) => prev.filter((c) => !categoryIds.includes(c.id)));
      setItems((prev) => prev.filter((item) => !deletedItemIds.has(item.id)));
      setCategoryToDelete(null);

      toast({
        title: "Categoría eliminada",
        description: `Se borraron ${plural(subcategories.length, "subcategoría", "subcategorías")} y ${plural(itemsToDelete.length, "producto", "productos")}.`,
      });
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar la categoría.",
      });
    } finally {
      setDeletingCategory(false);
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

  const normalizedCategorySearch = norm(categorySearchTerm);
  const categoryMatchesSearch = (category: Category) =>
    norm(`${category.name} ${category.description ?? ""}`).includes(
      normalizedCategorySearch
    );
  const displayedRootCategories = !normalizedCategorySearch
    ? sortedRootCategories
    : sortedRootCategories.filter(
        (parent) =>
          categoryMatchesSearch(parent) ||
          (childrenByParent.get(parent.id) ?? []).some(categoryMatchesSearch)
      );

  return (
    <div

      className="min-h-screen w-full min-w-0 space-y-4 overflow-x-hidden p-0 sm:space-y-6 sm:p-2"
      style={{ backgroundColor: `hsl(${ui.adminBackground})` }}
    >
      <AlertDialog
        open={categoryToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deletingCategory) setCategoryToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Eliminar la categoría &quot;{categoryToDelete?.category.name}&quot;?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>
                  Si continuás, también se van a borrar{" "}
                  <strong>
                    {plural(categoryToDelete?.subcategories.length ?? 0, "subcategoría", "subcategorías")}
                  </strong>{" "}
                  y{" "}
                  <strong>
                    {plural(categoryToDelete?.items.length ?? 0, "producto", "productos")}
                  </strong>{" "}
                  que están dentro de esta categoría, con sus fotos.
                </p>
                <p className="font-semibold">Esta acción no se puede deshacer.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingCategory}>Cancelar</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={deletingCategory}
              onClick={confirmDeleteCategory}
            >
              {deletingCategory ? "Eliminando..." : "Eliminar todo"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={itemToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setItemToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Eliminar &quot;{itemToDelete?.name}&quot;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              El plato se borra de la Carta A y de la Carta B, junto con su foto.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => {
                const target = itemToDelete;
                setItemToDelete(null);
                if (target) void handleDeleteItem(target.id);
              }}
            >
              Eliminar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
    className="transition-colors text-[hsl(var(--tab-inactive-text))] hover:bg-[hsl(var(--tab-hover-bg))] hover:text-[hsl(var(--tab-hover-text))] data-[state=active]:bg-[hsl(var(--tab-active-bg))] data-[state=active]:text-[hsl(var(--tab-active-text))] sm:px-5"
    style={{
      "--tab-inactive-text": ui.adminCardForeground,
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
    className="transition-colors text-[hsl(var(--tab-inactive-text))] hover:bg-[hsl(var(--tab-hover-bg))] hover:text-[hsl(var(--tab-hover-text))] data-[state=active]:bg-[hsl(var(--tab-active-bg))] data-[state=active]:text-[hsl(var(--tab-active-text))] sm:px-5"
    style={{
      "--tab-inactive-text": ui.adminCardForeground,
      "--tab-active-bg": ui.adminSidebarBg,
      "--tab-active-text": ui.adminSidebarText,
      "--tab-hover-bg": ui.adminAccent,
      "--tab-hover-text": ui.adminCard,
    } as CSSProperties}
  >
    Items del Menú
  </TabsTrigger>
</TabsList>
        <Button
          onClick={() => {
            if (activeMenuTab === "categories") {
              setFormCatName("");
              setFormCatParentId("");
              setCreateCategoryOpen(true);
              return;
            }

            if (categories.length === 0) {
              setActiveMenuTab("categories");
              toast({
                title: "Creá primero una categoría",
                description: "Después vas a poder agregar items dentro de ella.",
              });
              return;
            }
            setCreateForm({ ...emptyItem, currency: tenantCurrency });
            setCreatePriceText("");
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
          {activeMenuTab === "categories" ? "Agregar categoría" : "Agregar Item"}
        </Button>
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
                <p className="font-semibold">
                  Tus clientes ven la Carta {activeMenuVariant}
                </p>
                <p className="text-sm opacity-70">
                  Tocá acá para cambiar la carta publicada o programar el cambio automático.
                </p>
              </div>
              {menuPublicationOpen ? (
                <ChevronDown className="h-5 w-5 shrink-0" />
              ) : (
                <ChevronRight className="h-5 w-5 shrink-0" />
              )}
            </button>
          </CardContent>
        </Card>

      <Card
        className="mt-3 border-0 shadow-sm ring-1 ring-black/5"
        style={{
          backgroundColor: `hsl(${ui.adminCard})`,
          color: `hsl(${ui.adminCardForeground})`,
        }}
      >
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <p className="font-semibold">Estás editando</p>
            <p className="text-sm opacity-70">
              Lo que ocultes u ordenes se aplica solo a la carta elegida.
            </p>
          </div>
          <div
            className="grid w-full grid-cols-2 overflow-hidden rounded-md border sm:w-fit"
            style={{ borderColor: `hsl(${ui.adminSidebarBg})` }}
            role="group"
            aria-label="Carta que estás editando"
          >
            {(["A", "B"] as const).map((variant) => {
              const isSelected = orderMenuVariant === variant;
              const isPublished = activeMenuVariant === variant;
              return (
                <Button
                  key={variant}
                  type="button"
                  variant="ghost"
                  aria-pressed={isSelected}
                  onClick={() => setOrderMenuVariant(variant)}
                  className="h-auto flex-col gap-0.5 rounded-none px-5 py-2 font-semibold hover:opacity-90"
                  style={{
                    backgroundColor: isSelected
                      ? `hsl(${ui.adminSidebarBg})`
                      : `hsl(${ui.adminCard})`,
                    color: isSelected
                      ? `hsl(${ui.adminSidebarText})`
                      : `hsl(${ui.adminSidebarBg})`,
                  }}
                >
                  <span>Carta {variant}</span>
                  <span className="flex items-center gap-1 text-[11px] font-normal opacity-80">
                    {isPublished ? (
                      <>
                        <CheckCircle2 className="h-3 w-3" /> Publicada
                      </>
                    ) : (
                      "No publicada"
                    )}
                  </span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {menuPublicationOpen && (
        <div id="menu-publication-details" className="space-y-4">
      <Card
        className="border-0 shadow-sm ring-1 ring-black/5"
        style={{
          backgroundColor: `hsl(${ui.adminCard})`,
          color: `hsl(${ui.adminCardForeground})`,
        }}
      >
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <p className="font-semibold">Elegí qué carta queda publicada</p>
            <p className="mt-1 text-sm opacity-70">
              El mismo QR va a mostrar la carta seleccionada.
            </p>
          </div>
          <div
            className="grid w-fit shrink-0 grid-cols-2 overflow-hidden rounded-md border"
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

      <Card
        className="border-0 shadow-sm ring-1 ring-black/5"
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

          <div className="rounded-lg border p-3">
            <p className="font-semibold">¿Cómo querés programar el cambio?</p>
            <p className="mt-1 text-sm opacity-70">
              Podés repetirlo por días de la semana o elegir una fecha exacta del calendario.
            </p>
            {!menuAutomation.enabled && (
              <p className="mt-2 text-xs font-medium opacity-70">
                Activá el cambio automático para agregar una programación.
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={!menuAutomation.enabled}
                style={{
                  backgroundColor: `hsl(${ui.adminCard})`,
                  color: `hsl(${ui.adminCardForeground})`,
                  borderColor: `hsl(${ui.adminCardForeground} / 0.3)`,
                }}
                onClick={() => {
                  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
                  setMenuAutomation((current) => ({
                    ...current,
                    rules: [
                      ...current.rules,
                      {
                        id,
                        days: [],
                        startTime: "10:00",
                        endTime: "17:00",
                        variant: current.defaultVariant === "A" ? "B" : "A",
                      },
                    ],
                  }));
                  setRecentlyAddedRuleId(id);
                  toast({ title: "Horario semanal agregado", description: "Completalo y guardá la automatización." });
                }}
              >
                Agregar horario semanal
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!menuAutomation.enabled}
                style={{
                  backgroundColor: `hsl(${ui.adminCard})`,
                  color: `hsl(${ui.adminCardForeground})`,
                  borderColor: `hsl(${ui.adminCardForeground} / 0.3)`,
                }}
                onClick={() => {
                  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
                  setMenuAutomation((current) => ({
                    ...current,
                    rules: [
                      ...current.rules,
                      {
                        id,
                        date: getTodayInArgentina(),
                        days: [],
                        startTime: "10:00",
                        endTime: "17:00",
                        variant: current.defaultVariant === "A" ? "B" : "A",
                      },
                    ],
                  }));
                  setRecentlyAddedRuleId(id);
                  toast({ title: "Fecha específica agregada", description: "Elegí la fecha, completá el horario y guardá." });
                }}
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                Agregar fecha específica
              </Button>
            </div>
          </div>

          {menuAutomation.enabled && (
            <div className="space-y-4">
              {menuAutomation.rules.map((rule, ruleIndex) => (
                <div
                  id={`automation-rule-${rule.id}`}
                  key={rule.id}
                  className={`space-y-3 rounded-lg border p-3 transition-shadow duration-300 ${
                    recentlyAddedRuleId === rule.id ? "ring-2 ring-offset-2" : ""
                  }`}
                  style={
                    recentlyAddedRuleId === rule.id
                      ? ({ "--tw-ring-color": `hsl(${ui.adminAccent})` } as CSSProperties)
                      : undefined
                  }
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">
                      {rule.date !== undefined ? "Fecha específica" : "Horario semanal"} {ruleIndex + 1}
                    </p>
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

                  {rule.date !== undefined ? (
                    <div className="max-w-xs space-y-1">
                      <Label>Fecha</Label>
                      <div className="relative">
                        <Input
                          type="date"
                          className="[&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
                          value={rule.date}
                          onChange={(event) =>
                            setMenuAutomation((current) => ({
                              ...current,
                              rules: current.rules.map((item) =>
                                item.id === rule.id ? { ...item, date: event.target.value } : item
                              ),
                            }))
                          }
                        />
                        <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60" />
                      </div>
                      <p className="text-xs opacity-65">
                        Esta fecha tiene prioridad sobre los horarios semanales.
                      </p>
                    </div>
                  ) : (
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
                  )}

                  <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                    <div className="space-y-1">
                      <Label>Desde</Label>
                      <div className="relative">
                        <Input
                          type="time"
                          style={{ colorScheme: "dark" }}
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
                    </div>
                    <div className="space-y-1">
                      <Label>Hasta</Label>
                      <div className="relative">
                        <Input
                          type="time"
                          style={{ colorScheme: "dark" }}
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
        className="border-0 shadow-sm ring-1 ring-black/5"
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
                Con el selector "Estás editando" elegís qué carta modificar. El ojo
                muestra u oculta categorías e items, y cada carta conserva su propio
                orden. El mismo QR siempre muestra la carta publicada.
              </p>
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
                Arrastrá las filas para ordenar los platos de la Carta {orderMenuVariant}.
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

                  <Sheet open={createOpen} onOpenChange={(open) => { if (!savingItem) setCreateOpen(open); }}>


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
                                "--case-button-border": ui.adminCardForeground,
                                "--case-button-text": ui.adminCardForeground,
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
                                "--case-button-border": ui.adminCardForeground,
                                "--case-button-text": ui.adminCardForeground,
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
                            inputMode="decimal"
                            min={0}
                            placeholder="Ej: 12000"
                            className="sm:col-span-3"
                            value={createPriceText}
                            onChange={(e) => {
                              setCreatePriceText(e.target.value);
                              onChangeCreate("price", Number(e.target.value) || 0);
                            }}
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
                          <div className="flex items-center gap-3 sm:col-span-3">
                            <Switch
                              checked={!!createForm.isSpecial}
                              onCheckedChange={(checked) =>
                                setCreateForm((prev) => ({
                                  ...prev,
                                  isSpecial: checked,
                                }))
                              }
                            />
                            <span className="text-xs opacity-70">
                              Marca el plato con un ícono destacado en la carta.
                            </span>
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
                        {createMissing.length > 0 && (
                          <p className="text-sm sm:mr-auto sm:self-center" role="status">
                            Falta: {createMissing.join(", ")}.
                          </p>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleCreateItem(true)}
                          disabled={savingItem || createMissing.length > 0}
                        >
                          Guardar y agregar otro
                        </Button>
                        <Button
                          type="button"
                          onClick={() => handleCreateItem()}
                          disabled={savingItem || createMissing.length > 0}
                        >
                          {savingItem ? "Guardando..." : "Guardar Item"}
                        </Button>
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
                  <div className="min-w-[580px] overflow-hidden rounded-md">
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
                          <TableHead className="text-[hsl(var(--table-head-text))]">
                            Visible en {orderMenuVariant}
                          </TableHead>
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
                          const isVisibleInSelectedMenu = isVisibleInMenu(
                            item,
                            orderMenuVariant,
                            ["A"]
                          );

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
                                {!imageUrl && (
                                  <button
                                    type="button"
                                    onClick={() => handleStartEdit(item)}
                                    className="flex h-[50px] w-[50px] flex-col items-center justify-center rounded-md border border-dashed text-[10px] opacity-60 transition-opacity hover:opacity-100"
                                    style={{ borderColor: `hsl(${ui.adminCardForeground} / 0.4)` }}
                                    title="Agregar foto"
                                    aria-label={`Agregar foto a ${item.name}`}
                                  >
                                    <Camera className="h-4 w-4" />
                                    Foto
                                  </button>
                                )}
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
                                    <span className="opacity-60">{parentName}</span>
                                    <span className="opacity-60"> › </span>
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
                                  title={
                                    isVisibleInSelectedMenu
                                      ? `Ocultar de Carta ${orderMenuVariant}`
                                      : `Mostrar en Carta ${orderMenuVariant}`
                                  }
                                  aria-label={
                                    isVisibleInSelectedMenu
                                      ? `Ocultar ${item.name} de Carta ${orderMenuVariant}`
                                      : `Mostrar ${item.name} en Carta ${orderMenuVariant}`
                                  }
                                  aria-pressed={isVisibleInSelectedMenu}
                                  onClick={() =>
                                    handleToggleMenuVariant(
                                      item,
                                      orderMenuVariant,
                                      !isVisibleInSelectedMenu
                                    )
                                  }
                                  className={
                                    isVisibleInSelectedMenu
                                      ? "text-[hsl(var(--visible-eye-color))] hover:bg-[hsl(var(--visible-eye-color))] hover:text-white"
                                      : "text-muted-foreground opacity-55 hover:bg-[hsl(var(--visible-eye-color))] hover:text-white hover:opacity-100"
                                  }
                                  style={{
                                    "--visible-eye-color": ui.adminAccent,
                                  } as CSSProperties}
                                >
                                  {isVisibleInSelectedMenu ? (
                                    <Eye className="h-5 w-5" />
                                  ) : (
                                    <EyeOff className="h-5 w-5" />
                                  )}
                                </Button>
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
                                      "--delete-color": deleteColor,
                                      "--delete-hover-text": ui.adminCard,
                                    } as CSSProperties}
                                    onClick={() => setItemToDelete({ id: item.id, name: item.name })}
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

          <Sheet open={editOpen} onOpenChange={(open) => { if (!savingItem) setEditOpen(open); }}>
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
                        "--case-button-border": ui.adminCardForeground,
                        "--case-button-text": ui.adminCardForeground,
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
                        "--case-button-border": ui.adminCardForeground,
                        "--case-button-text": ui.adminCardForeground,
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
                <Button
                  type="button"
                  onClick={handleUpdateItem}
                  disabled={!editId || savingItem}
                  className="transition-transform active:translate-y-0.5 active:scale-[0.98]"
                  style={{
                    backgroundColor: `hsl(${ui.navBg})`,
                    color: `hsl(${ui.navText})`,
                  }}
                >
                  {savingItem ? "Guardando..." : "Guardar Cambios"}
                </Button>
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
              <CardDescription>
                Las secciones de la Carta {orderMenuVariant}. Usá el ojo para mostrar u
                ocultar cada una y arrastralas para ordenarlas.
              </CardDescription>

              <div className="mt-4 flex items-center gap-2">
                <Label htmlFor="category-search" className="text-sm">
                  Buscar:
                </Label>
                <Input
                  id="category-search"
                  className="h-9 w-full sm:w-64"
                  placeholder="Nombre de categoría..."
                  value={categorySearchTerm}
                  onChange={(event) => setCategorySearchTerm(event.target.value)}
                />
              </div>
            </CardHeader>

            <CardContent className="px-4 pb-4 pt-5 sm:px-6 sm:pb-6 sm:pt-5">
              {categories.length === 0 ? (
                <div className="space-y-3 text-sm">
                  <p className="font-semibold">Armá tu carta en 3 pasos:</p>
                  <ol className="space-y-2">
                    <li><span className="font-semibold">1.</span> Creá una categoría (por ejemplo "Entradas") con el botón Agregar categoría.</li>
                    <li><span className="font-semibold">2.</span> Pasá a la pestaña Items del Menú y agregá tus platos.</li>
                    <li><span className="font-semibold">3.</span> Descargá tu QR desde la sección QR y compartilo.</li>
                  </ol>
                </div>
              ) : displayedRootCategories.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No se encontraron categorías.
                </p>
              ) : (
                <div className="space-y-3">
                  {displayedRootCategories.map((parent, index) => {
                    const allChildren = childrenByParent.get(parent.id) ?? [];
                    const children =
                      normalizedCategorySearch && !categoryMatchesSearch(parent)
                        ? allChildren.filter(categoryMatchesSearch)
                        : allChildren;
                    const isParentVisibleInSelectedMenu = isVisibleInMenu(
                      parent,
                      orderMenuVariant,
                      ["A", "B"]
                    );

                    return (
                      <div key={parent.id} className="space-y-2">
                        <div
                          className="flex items-center justify-between p-3 bg-secondary rounded-md cursor-pointer select-none"
                          draggable={!normalizedCategorySearch}
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
                              title={
                                isParentVisibleInSelectedMenu
                                  ? `Ocultar de Carta ${orderMenuVariant}`
                                  : `Mostrar en Carta ${orderMenuVariant}`
                              }
                              aria-label={
                                isParentVisibleInSelectedMenu
                                  ? `Ocultar ${parent.name} de Carta ${orderMenuVariant}`
                                  : `Mostrar ${parent.name} en Carta ${orderMenuVariant}`
                              }
                              aria-pressed={isParentVisibleInSelectedMenu}
                              onClick={() =>
                                onToggleCategoryVariant(
                                  parent,
                                  orderMenuVariant,
                                  !isParentVisibleInSelectedMenu
                                )
                              }
                              className={isParentVisibleInSelectedMenu
                                ? "text-[hsl(var(--visible-eye-color))] hover:bg-[hsl(var(--visible-eye-color))] hover:text-white"
                                : "text-muted-foreground opacity-55 hover:bg-[hsl(var(--visible-eye-color))] hover:text-white hover:opacity-100"}
                              style={{ "--visible-eye-color": ui.adminAccent } as CSSProperties}
                            >
                              {isParentVisibleInSelectedMenu ? (
                                <Eye className="h-5 w-5" />
                              ) : (
                                <EyeOff className="h-5 w-5" />
                              )}
                            </Button>

                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                title={`Agregar plato en ${parent.name}`}
                                aria-label={`Agregar plato en ${parent.name}`}
                                onClick={() => openCreateItemIn(parent.id)}
                                className="gap-1 px-2"
                              >
                                <PlusCircle className="h-4 w-4" />
                                <span className="hidden sm:inline">Plato</span>
                              </Button>

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
                                      "--delete-color": deleteColor,
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
                          children.map((child, childIndex) => {
                            const isChildVisibleInSelectedMenu = isVisibleInMenu(
                              child,
                              orderMenuVariant,
                              ["A", "B"]
                            );

                            return (
                            <div
                              key={child.id}
                              className="ml-8 flex cursor-grab items-center justify-between rounded-md border border-border/40 bg-secondary/60 p-3 active:cursor-grabbing"
                              draggable={!normalizedCategorySearch}
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
                                  title={
                                    isChildVisibleInSelectedMenu
                                      ? `Ocultar de Carta ${orderMenuVariant}`
                                      : `Mostrar en Carta ${orderMenuVariant}`
                                  }
                                  aria-label={
                                    isChildVisibleInSelectedMenu
                                      ? `Ocultar ${child.name} de Carta ${orderMenuVariant}`
                                      : `Mostrar ${child.name} en Carta ${orderMenuVariant}`
                                  }
                                  aria-pressed={isChildVisibleInSelectedMenu}
                                  onClick={() =>
                                    onToggleCategoryVariant(
                                      child,
                                      orderMenuVariant,
                                      !isChildVisibleInSelectedMenu
                                    )
                                  }
                                  className={isChildVisibleInSelectedMenu
                                    ? "text-[hsl(var(--visible-eye-color))] hover:bg-[hsl(var(--visible-eye-color))] hover:text-white"
                                    : "text-muted-foreground opacity-55 hover:bg-[hsl(var(--visible-eye-color))] hover:text-white hover:opacity-100"}
                                  style={{ "--visible-eye-color": ui.adminAccent } as CSSProperties}
                                >
                                  {isChildVisibleInSelectedMenu ? (
                                    <Eye className="h-5 w-5" />
                                  ) : (
                                    <EyeOff className="h-5 w-5" />
                                  )}
                                </Button>

                                <div className="flex items-center gap-2">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    title={`Agregar plato en ${child.name}`}
                                    aria-label={`Agregar plato en ${child.name}`}
                                    onClick={() => openCreateItemIn(child.id)}
                                    className="gap-1 px-2"
                                  >
                                    <PlusCircle className="h-4 w-4" />
                                    <span className="hidden sm:inline">Plato</span>
                                  </Button>

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
                                      "--delete-color": deleteColor,
                                      "--delete-hover-text": ui.adminCard,
                                    } as CSSProperties}
                                    onClick={() => onDeleteCategory(child)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                            );
                          })}
                      </div>
                    );
                  })}
                </div>
              )}

              <Sheet
                open={createCategoryOpen}
                onOpenChange={setCreateCategoryOpen}
              >
                <SheetContent className="sm:max-w-lg">
                  <SheetHeader>
                    <SheetTitle>Agregar nueva categoría</SheetTitle>
                    <SheetDescription>
                      Creá una categoría o una subcategoría para la Carta
                      {` ${orderMenuVariant}`}.
                    </SheetDescription>
                  </SheetHeader>

                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
                      <Label htmlFor="new-cat-name" className="sm:text-right">
                        Nombre
                      </Label>
                      <div className="flex min-w-0 items-center gap-2 sm:col-span-3">
                        <Input
                          id="new-cat-name"
                          className="min-w-0 flex-1"
                          placeholder="Ej: Entradas"
                          value={formCatName}
                          onChange={(event) => setFormCatName(event.target.value)}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          title="Convertir a mayúsculas"
                          onClick={() =>
                            setFormCatName(
                              formCatName.toLocaleUpperCase("es-AR")
                            )
                          }
                          className="border-[hsl(var(--case-button-border))] bg-transparent px-3 text-[hsl(var(--case-button-text))] hover:bg-[hsl(var(--case-button-hover-bg))] hover:text-[hsl(var(--case-button-hover-text))]"
                          style={{
                            "--case-button-border": ui.adminCardForeground,
                            "--case-button-text": ui.adminCardForeground,
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
                            setFormCatName(
                              formCatName.toLocaleLowerCase("es-AR")
                            )
                          }
                          className="border-[hsl(var(--case-button-border))] bg-transparent px-3 text-[hsl(var(--case-button-text))] hover:bg-[hsl(var(--case-button-hover-bg))] hover:text-[hsl(var(--case-button-hover-text))]"
                          style={{
                            "--case-button-border": ui.adminCardForeground,
                            "--case-button-text": ui.adminCardForeground,
                            "--case-button-hover-bg": ui.adminAccent,
                            "--case-button-hover-text": ui.adminCard,
                          } as CSSProperties}
                        >
                          aa
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
                      <Label htmlFor="new-cat-parent" className="sm:text-right">
                        Sección principal
                      </Label>
                      <select
                        id="new-cat-parent"
                        className="col-span-3 h-9 rounded-md border bg-background px-2 text-sm"
                        value={formCatParentId}
                        onChange={(event) =>
                          setFormCatParentId(event.target.value)
                        }
                      >
                        <option value="">Ninguna (sección principal)</option>
                        {sortedRootCategories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <SheetFooter>
                    <SheetClose asChild>
                      <Button variant="secondary">Cancelar</Button>
                    </SheetClose>
                    <Button
                      type="button"
                      disabled={!formCatName.trim()}
                      onClick={onCreateCategory}
                      style={{
                        backgroundColor: `hsl(${ui.navBg})`,
                        color: `hsl(${ui.navText})`,
                      }}
                    >
                      Crear categoría
                    </Button>
                  </SheetFooter>
                </SheetContent>
              </Sheet>

              <Sheet open={catModalOpen} onOpenChange={setCatModalOpen}>
                <SheetContent className="sm:max-w-lg">
                  <SheetHeader>
                    <SheetTitle>Editar categoría</SheetTitle>
                    <SheetDescription>
                      Modificá el nombre o la sección principal.
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
                            "--case-button-border": ui.adminCardForeground,
                            "--case-button-text": ui.adminCardForeground,
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
                            "--case-button-border": ui.adminCardForeground,
                            "--case-button-text": ui.adminCardForeground,
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

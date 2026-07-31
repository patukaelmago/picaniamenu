"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Search, Leaf, Sparkles, PackageX, WheatOff, ChevronLeft, ChevronRight, X } from "lucide-react";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { useTheme } from "next-themes";

import { listenFridayData, type FridayData } from "@/lib/menu-viernes-service";
import type { Category, MenuItem } from "@/lib/types";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { listMenuItems, listenMenuItems } from "@/lib/menu-service";
import { listCategories, listenCategories } from "@/lib/categories-service";
import { useTenantUI } from "@/hooks/use-tenant-ui";
import { useRestaurantSettings } from "@/hooks/use-restaurant-settings";
import { db } from "@/lib/firebase";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles as SparklesIcon } from "lucide-react";

const formatCurrency = (
  price: number,
  currency: "ARS" | "USD"
) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);

const TagIcon = ({ tag }: { tag: string }) => {
  switch (tag) {
    case "Especial":
      return <Sparkles className="h-4 w-4 text-accent" />;
    case "Sin stock":
      return <PackageX className="h-4 w-4 text-destructive" />;
    case "sin TACC":
      return <WheatOff className="h-4 w-4 text-blue-500" />;
    case "veggie":
      return <Leaf className="h-4 w-4 text-green-500" />;
    default:
      return null;
  }
};

const norm = (s: string) =>
  (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const hslLightness = (value: string) => {
  const match = value.match(/(-?\d+(?:\.\d+)?)%\s*$/);
  return match ? Number(match[1]) : 50;
};

function fridayDescOverride(
  itemName: string,
  originalDesc: string | undefined,
  fridayData: FridayData
) {
  const n = norm(itemName);

  if (n === "entrada") return fridayData?.entrada ?? "";
  if (n === "postre o cafe" || n === "postre" || n === "cafe") {
    return fridayData?.postre ?? "";
  }

  return originalDesc ?? "";
}

type Props = { tenantId: string };

export default function MenuClient({ tenantId }: Props) {
  const { setTheme, resolvedTheme } = useTheme();
  console.log("TENANT:", tenantId);
  console.log("THEME:", resolvedTheme);


  const [categoryNavIndex, setCategoryNavIndex] = useState(0);

  const [allMenuItems, setAllMenuItems] = useState<MenuItem[]>([]);
  const [activeMenuVariant, setActiveMenuVariant] = useState<"A" | "B">("A");
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [openItemImage, setOpenItemImage] = useState<{
    src: string;
    name: string;
    description: string;
    price: number;
  } | null>(null);

  const ui = useTenantUI(tenantId);
  const settings = useRestaurantSettings();
  const tenantCurrency: "ARS" | "USD" =
    settings?.currency === "USD" ? "USD" : "ARS";
  const uiReady = true;
  const isPulpo = tenantId.toLowerCase() === "pulpo";
  const menuItems = useMemo(
    () =>
      allMenuItems.filter(
        (item) =>
          !isPulpo ||
          (item.menuVariants ?? ["A"]).includes(activeMenuVariant)
      ),
    [activeMenuVariant, allMenuItems, isPulpo]
  );

  const copy = {
    title: "NUESTRA CARTA",
    search: "Buscar por plato, ingrediente...",
    special: "Sugerencia",
    glutenFree: "Sin TACC",
    empty: "No encontramos platos que coincidan con la búsqueda.",
    previous: "Categoría anterior",
    next: "Categoría siguiente",
  };
  const readableSubCategoryTitle =
    Math.abs(hslLightness(ui.subCategoryTitle) - hslLightness(ui.background)) < 28
      ? ui.foreground
      : ui.subCategoryTitle;
  const searchBackground = ui.navBg;
  const readableSearchText =
    Math.abs(hslLightness(ui.searchText) - hslLightness(searchBackground)) < 28
      ? ui.navText
      : ui.searchText;
  const readableSearchIcon =
    Math.abs(hslLightness(ui.searchIcon) - hslLightness(searchBackground)) < 28
      ? ui.navText
      : ui.searchIcon;
  const indicatorBackground =
    hslLightness(ui.background) >= hslLightness(ui.foreground)
      ? ui.background
      : ui.foreground;
  const indicatorForeground =
    indicatorBackground === ui.background ? ui.foreground : ui.background;
  const indicatorStyle = {
    color: `hsl(${indicatorForeground})`,
    borderColor: `hsl(${indicatorForeground} / 0.3)`,
    backgroundColor: `hsl(${indicatorBackground})`,
  };

  const getItemImage = (item: MenuItem) => {
    if (item.showImage === false) return "";
    const placeholder = PlaceHolderImages.find((p) => p.id === item.imageId);
    return item.imageUrl || placeholder?.imageUrl || "";
  };

  const itemThumbnail = (item: MenuItem) => {
    const src = getItemImage(item);
    if (!src) return null;

    return (
      <button
        type="button"
        onClick={() =>
          setOpenItemImage({
            src,
            name: item.name,
            description: item.description || "",
            price: item.price,
          })
        }
        className="group/item-image float-left mr-3 mb-2 h-14 w-14 overflow-hidden rounded-md border shadow-sm md:h-16 md:w-16"
        style={{ borderColor: `hsl(${ui.foreground} / 0.3)` }}
        aria-label={`Ver imagen de ${item.name}`}
      >
        <img
          src={src}
          alt={item.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover/item-image:scale-110"
        />
      </button>
    );
  };

  const specialBadge = (item: MenuItem) =>
    item.isSpecial ? (
      <Badge
        variant="outline"
        className="ml-2 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full p-0"
        style={indicatorStyle}
        title={copy.special}
        aria-label={copy.special}
      >
        <SparklesIcon className="h-3.5 w-3.5" />
      </Badge>
    ) : null;

  const sinTaccBadge = (item: MenuItem) =>
    (item.tags ?? []).includes("sin TACC") ? (
      <Badge
        variant="outline"
        className="ml-2 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full p-0"
        style={indicatorStyle}
        title={copy.glutenFree}
        aria-label={copy.glutenFree}
      >
        <WheatOff className="h-3.5 w-3.5" />
      </Badge>
    ) : null;

  const [fridayData, setFridayData] = useState<FridayData>({
    entrada: "",
    postre: "",
  });

  const [mounted, setMounted] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [loadedSlides, setLoadedSlides] = useState<Record<number, boolean>>({});
  const [tenantCarouselImages, setTenantCarouselImages] = useState<string[]>([]);

  useEffect(() => {
    const r = document.documentElement;

    r.style.setProperty("--nav-bg", ui.navBg);
    r.style.setProperty("--nav-text", ui.navText);
    r.style.setProperty("--accent", ui.accent);
    r.style.setProperty("--search-icon", ui.searchIcon);

    return () => {
      r.style.removeProperty("--nav-bg");
      r.style.removeProperty("--nav-text");
      r.style.removeProperty("--accent");
      r.style.removeProperty("--search-icon");
    };
  }, [ui.navBg, ui.navText, ui.accent]);

  useEffect(() => {
    if (!uiReady) return;
    if (!ui.showFriday) return;

    const unsub = listenFridayData(tenantId, (data) => {
      setFridayData(data);
    });

    return () => unsub();
  }, [tenantId, uiReady, ui.showFriday]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    return listenMenuItems(
      tenantId,
      (items) => {
        setAllMenuItems(items.filter((i) => i.isVisible !== false));
      },
      { onlyVisible: true }
    );
  }, [tenantId]);

  useEffect(() => {
    if (!isPulpo) return;

    return onSnapshot(
      doc(db, "tenants", tenantId, "settings", "menuVariants"),
      (snapshot) => {
        setActiveMenuVariant(snapshot.data()?.activeVariant === "B" ? "B" : "A");
      }
    );
  }, [isPulpo, tenantId]);

  useEffect(() => {
    return listenCategories(tenantId, (cats) => {
      setCategories(cats);
    });
  }, [tenantId]);

  useEffect(() => {
    (async () => {
      try {
        const ref = doc(db, "tenants", tenantId, "settings", "ui");
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setTenantCarouselImages([]);
          return;
        }

        const data = snap.data();
        const images = Array.isArray(data?.carouselImages)
          ? data.carouselImages.filter(
            (img: unknown): img is string =>
              typeof img === "string" && img.trim() !== ""
          )
          : [];

        setTenantCarouselImages(images);
      } catch (e) {
        console.error("Error cargando carouselImages del tenant", e);
        setTenantCarouselImages([]);
      }
    })();
  }, [tenantId]);

  const rootCategories = useMemo(
    () =>
      categories.filter(
        (c) => !c.parentCategoryId && (isPulpo || c.isVisible !== false)
      ),
    [categories, isPulpo]
  );

  const childCategoriesByParent = useMemo(() => {
    const map: Record<string, Category[]> = {};

    categories.forEach((c) => {
      if (c.parentCategoryId) {
        if (!map[c.parentCategoryId]) map[c.parentCategoryId] = [];
        map[c.parentCategoryId].push(c);
      }
    });

    Object.values(map).forEach((arr) =>
      arr.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    );

    return map;
  }, [categories]);

  const selectedCategoryIds = useMemo(() => {
    if (selectedCategory === "all") return null;

    const children = categories
      .filter((c) => c.parentCategoryId === selectedCategory)
      .map((c) => c.id);

    return [selectedCategory, ...children];
  }, [selectedCategory, categories]);

  const filteredItems = useMemo(() => {
    const term = search.toLowerCase().trim();

    return menuItems.filter((item) => {
      if (!item.isVisible) return false;

      if (selectedCategoryIds && !selectedCategoryIds.includes(item.categoryId)) {
        return false;
      }

      if (!term) return true;

      const desc = item.description?.toLowerCase() ?? "";

      const category = categories.find((c) => c.id === item.categoryId);
      const parentCategory = category?.parentCategoryId
        ? categories.find((c) => c.id === category.parentCategoryId)
        : undefined;

      const catName = category?.name.toLowerCase() ?? "";
      const parentCatName = parentCategory?.name.toLowerCase() ?? "";

      const matchesText =
        item.name.toLowerCase().includes(term) ||
        desc.includes(term) ||
        (item.searchKeywords ?? []).some((k) => k.toLowerCase().includes(term));

      const matchesCategory = catName.includes(term) || parentCatName.includes(term);

      return matchesText || matchesCategory;
    });
  }, [menuItems, selectedCategoryIds, search, categories]);

  const visibleRootCategories = useMemo(() => {
    const isSuggestion = (name: string) => norm(name) === "sugerencia del dia";

    if (selectedCategory !== "all") {
      return rootCategories.filter((c) => c.id === selectedCategory && !isSuggestion(c.name));
    }

    return rootCategories
      .filter((c) => !isSuggestion(c.name))
      .filter((cat) => {
        const childCats = childCategoriesByParent[cat.id] ?? [];
        const hasDirectItems = filteredItems.some((item) => item.categoryId === cat.id);
        const hasChildItems = childCats.some((sub) =>
          filteredItems.some((item) => item.categoryId === sub.id)
        );
        return hasDirectItems || hasChildItems;
      });
  }, [rootCategories, childCategoriesByParent, filteredItems, selectedCategory]);

  const didHashScrollRef = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (didHashScrollRef.current) return;

    const hash = window.location.hash;
    if (!hash) return;

    const id = hash.slice(1);
    let tries = 0;

    const interval = window.setInterval(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        didHashScrollRef.current = true;
        window.clearInterval(interval);
        const clean = window.location.pathname + window.location.search;
        window.history.replaceState(null, "", clean);
      }
      tries++;
      if (tries > 15) window.clearInterval(interval);
    }, 100);

    return () => window.clearInterval(interval);
  }, [visibleRootCategories.length]);

  const carouselImages = useMemo(() => {
    if (tenantCarouselImages.length > 0) {
      return tenantCarouselImages.map((src, idx) => ({
        src,
        alt: `Slide ${idx + 1}`,
        hint: undefined,
      }));
    }

    const sugCat = categories.find((c) => norm(c.name) === "sugerencia del dia");
    const items = sugCat
      ? menuItems.filter((i) => i.categoryId === sugCat.id && i.isVisible !== false)
      : [];

    const imgs = items
      .map((item) => {
        const ph = PlaceHolderImages.find((p) => p.id === item.imageId);
        const src = ph?.imageUrl || item.imageUrl || "/img/placeholder.jpg";
        return { src, alt: item.name, hint: ph?.imageHint };
      })
      .slice(0, 6);

    if (imgs.length === 0) return [];

    return imgs;
  }, [tenantCarouselImages, categories, menuItems]);

  useEffect(() => {
    if (!mounted) return;
    if (!carouselImages.length) return;

    const id = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % carouselImages.length);
    }, 4500);

    return () => window.clearInterval(id);
  }, [carouselImages, mounted]);

  useEffect(() => {
    setLoadedSlides({});
    setActiveSlide(0);
  }, [carouselImages]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const categoryNavItems = [
    ...(ui.showFriday ? [{ id: "menu-viernes", name: "ALMUERZO EJECUTIVO" }] : []),
    ...visibleRootCategories
      .filter((cat) => {
        const n = norm(cat.name);
        return n !== "menu viernes" && n !== "almuerzo ejecutivo";
      })
      .map((cat) => ({
        id: `cat-${cat.id}`,
        name: cat.name,
      })),
  ];

  useEffect(() => {
    if (categoryNavIndex >= categoryNavItems.length) {
      setCategoryNavIndex(0);
    }
  }, [categoryNavItems.length, categoryNavIndex]);
  const navScrollRef = useRef<HTMLDivElement | null>(null);

  const moveCategoryNav = (dir: "left" | "right") => {
    setCategoryNavIndex((prev) => {
      if (dir === "left") {
        return prev === 0
          ? categoryNavItems.length - 1
          : prev - 1;
      }

      return prev === categoryNavItems.length - 1
        ? 0
        : prev + 1;
    });
  };
  const menuCategoryPages = useMemo(() => {
    type PageCategory = {
      category: Category;
      itemIds: string[];
      isFirstSegment: boolean;
    };

    const pages: PageCategory[][] = [];
    let currentPage: PageCategory[] = [];
    let currentWeight = 0;
    // Deja margen real para el borde inferior de la hoja. Los títulos,
    // descripciones e imágenes ocupan más alto que una fila simple.
    const pageCapacity = 18;

    const finishPage = () => {
      if (currentPage.length > 0) pages.push(currentPage);
      currentPage = [];
      currentWeight = 0;
    };

    visibleRootCategories.forEach((category) => {
      const normalizedCategoryName = norm(category.name);
      const isPicaniaTableService =
        tenantId === "picania" &&
        (normalizedCategoryName === "servicio de mesa" ||
          normalizedCategoryName === "servicios de mesa");
      const isPicaniaExecutiveLunch =
        tenantId === "picania" &&
        (normalizedCategoryName === "menu viernes" ||
          normalizedCategoryName === "almuerzo ejecutivo");

      if (isPicaniaExecutiveLunch && currentPage.length > 0) {
        finishPage();
      }

      const childCats = childCategoriesByParent[category.id] ?? [];
      const parentItems = filteredItems.filter(
        (item) => item.categoryId === category.id
      );
      const orderedItems = [
        ...parentItems,
        ...childCats.flatMap((sub) =>
          filteredItems.filter((item) => item.categoryId === sub.id)
        ),
      ];

      let currentEntry: PageCategory | null = null;
      let isFirstSegment = true;
      let subcategoriesOnSegment = new Set<string>();

      orderedItems.forEach((item) => {
        const startsSegment = currentEntry === null;
        const isSubcategoryItem = item.categoryId !== category.id;
        const startsSubcategory =
          isSubcategoryItem && !subcategoriesOnSegment.has(item.categoryId);
        const hasVisibleImage =
          item.showImage !== false &&
          Boolean(
            item.imageUrl ||
              PlaceHolderImages.find((placeholder) => placeholder.id === item.imageId)
          );
        const itemWeight = hasVisibleImage ? 2.25 : item.description ? 1.5 : 1;
        const requiredWeight =
          itemWeight + (startsSegment ? 2.5 : 0) + (startsSubcategory ? 1 : 0);

        if (
          !isPicaniaTableService &&
          currentPage.length > 0 &&
          currentWeight + requiredWeight > pageCapacity
        ) {
          finishPage();
          currentEntry = null;
          subcategoriesOnSegment = new Set<string>();
        }

        if (!currentEntry) {
          currentEntry = {
            category,
            itemIds: [],
            isFirstSegment,
          };
          currentPage.push(currentEntry);
          currentWeight += 2.5;
          isFirstSegment = false;
        }

        if (
          isSubcategoryItem &&
          !subcategoriesOnSegment.has(item.categoryId)
        ) {
          subcategoriesOnSegment.add(item.categoryId);
          currentWeight += 1;
        }

        currentEntry.itemIds.push(item.id);
        currentWeight += itemWeight;
      });
    });

    finishPage();

    if (tenantId === "picania") {
      const isCategory = (entry: PageCategory, names: string[]) =>
        names.includes(norm(entry.category.name));
      const serviceNames = ["servicio de mesa", "servicios de mesa"];
      const lunchNames = ["menu viernes", "almuerzo ejecutivo"];

      const serviceEntries = pages
        .flat()
        .filter((entry) => isCategory(entry, serviceNames));
      const lunchEntries = pages
        .flat()
        .filter((entry) => isCategory(entry, lunchNames));

      const cleanPages = pages
        .map((page) =>
          page.filter(
            (entry) =>
              !isCategory(entry, serviceNames) &&
              !isCategory(entry, lunchNames)
          )
        )
        .filter((page) => page.length > 0);

      const spiritsPageIndex = cleanPages
        .map((page) =>
          page.some((entry) => norm(entry.category.name) === "destilados")
        )
        .lastIndexOf(true);

      if (spiritsPageIndex >= 0 && serviceEntries.length > 0) {
        cleanPages[spiritsPageIndex].push(...serviceEntries);
      }

      if (lunchEntries.length > 0) {
        cleanPages.splice(
          spiritsPageIndex >= 0 ? spiritsPageIndex + 1 : cleanPages.length,
          0,
          lunchEntries
        );
      }

      return cleanPages;
    }

    return pages;
  }, [visibleRootCategories, childCategoriesByParent, filteredItems, tenantId]);

  if (!uiReady) return null;



  return (
    <div className={tenantId === "picania" ? "dark" : ""}>
      <main
        className="min-h-screen scroll-smooth"
        style={{
          backgroundColor: `hsl(${ui.background})`,
          color: `hsl(${ui.foreground})`,
        }}
      >
        <section className="mx-auto max-w-5xl px-4 pt-8 pb-8 space-y-6">
          {mounted && carouselImages.length > 0 && (
            <div className="w-full">
              <div className="relative overflow-hidden rounded-xl border border-[rgba(0,0,0,0.08)] dark:border-[#fff7e3]/20 shadow-sm">
                <div className="relative h-[220px] md:h-[320px] w-full bg-muted/20">
                  {carouselImages.map((img, idx) => (
                    <img
                      key={`${img.src}-${idx}`}
                      src={img.src}
                      alt={img.alt}
                      data-ai-hint={img.hint}
                      loading={idx === 0 ? "eager" : "lazy"}
                      onLoad={() => setLoadedSlides((p) => ({ ...p, [idx]: true }))}
                      className={[
                        "absolute inset-0 h-full w-full object-cover",
                        "transition-opacity duration-700 ease-out",
                        idx === activeSlide ? "opacity-100" : "opacity-0",
                        loadedSlides[idx] ? "visible" : "invisible",
                      ].join(" ")}
                    />
                  ))}
                </div>

                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                  {carouselImages.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveSlide(i)}
                      className={[
                        "h-1.5 w-1.5 rounded-full transition-all",
                        i === activeSlide ? "bg-[#fff7e3]" : "bg-[#fff7e3]/50",
                      ].join(" ")}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4 items-center text-center">
            <div className="w-full">
              <div className="flex flex-col items-center gap-3 w-full">
                {ui.showFriday && <div className="hidden md:block" />}

                <h1 className="font-headline text-lg md:text-2xl lg:text-3xl tracking-[0.3em] uppercase">
                  {copy.title}
                </h1>

                {categoryNavItems.length > 0 && (
                  <div className="relative flex w-full items-center justify-center py-2">
                    <button
                      type="button"
                      onClick={() => moveCategoryNav("left")}
                      className="mr-7 flex items-center justify-center text-[hsl(var(--foreground))] opacity-90 hover:scale-110 transition-transform"
                      aria-label={copy.previous}
                    >
                      <ChevronLeft
                        className="h-10 w-10"
                        style={{ color: `hsl(${ui.foreground})` }}
                      />
                    </button>

                    <Button
                      onClick={() =>
                        scrollToSection(categoryNavItems[categoryNavIndex].id)
                      }
                      className="
        w-[320px]
        text-center
        px-2
        py-1

        font-headline
        uppercase
        tracking-[0.3em]

        text-[14px]

        bg-transparent
        border-b-2
        shadow-none
        ring-0
        focus:ring-0
        focus-visible:ring-0
        focus-visible:outline-none

        hover:bg-transparent
        hover:shadow-none

        transition-colors
      "
                      style={{
                        color: `hsl(${ui.categoryNav})`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = `hsl(${ui.categoryNavHover})`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = `hsl(${ui.categoryNav})`;
                      }}
                    >
                      {categoryNavItems[categoryNavIndex]?.name ?? ""}
                    </Button>

                    <button
                      type="button"
                      onClick={() => moveCategoryNav("right")}
                      className="ml-7 flex items-center justify-center text-[hsl(var(--foreground))] opacity-90 hover:scale-110 transition-transform"
                      aria-label={copy.next}
                    >
                      <ChevronRight
                        className="h-10 w-10"
                        style={{ color: `hsl(${ui.foreground})` }}
                      />
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="relative w-full">
              <Search
                className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2"
                style={{ color: `hsl(${readableSearchIcon})` }}
              />

              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={copy.search}
                style={{
                  color: `hsl(${readableSearchText})`,
                  caretColor: `hsl(${readableSearchText})`,
                  backgroundColor: `hsl(${searchBackground})`,
                  borderColor: `hsl(${ui.navText} / 0.35)`,
                  "--search-placeholder": readableSearchText,
                } as CSSProperties}
                className="pl-10 placeholder:!text-[hsl(var(--search-placeholder))] placeholder:!opacity-70 focus-visible:ring-1 focus-visible:ring-[hsl(var(--search-placeholder))]"
              />
            </div>
            <div
              className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs"
              style={{ color: `hsl(${ui.foreground})` }}
              aria-label="Referencias"
            >
              <span className="inline-flex items-center gap-2">
                <span
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full border"
                  style={indicatorStyle}
                >
                  <SparklesIcon className="h-3.5 w-3.5" />
                </span>
                {copy.special}
              </span>
              <span className="inline-flex items-center gap-2">
                <span
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full border"
                  style={indicatorStyle}
                >
                  <WheatOff className="h-3.5 w-3.5" />
                </span>
                {copy.glutenFree}
              </span>
            </div>
          </div>

          <div className="space-y-10">
            {menuCategoryPages.map((page, pageIndex) => (
              <section
                key={`menu-page-${pageIndex}`}
                className="mx-auto min-h-[calc((100vw-2rem)*297/210)] w-full max-w-3xl rounded-sm border px-5 pb-10 pt-10 shadow-sm md:aspect-[210/297] md:min-h-0 md:px-10 md:pb-14 md:pt-14"
                style={{ borderColor: `hsl(${ui.foreground} / 0.35)` }}
              >
                <div className="space-y-12">
                  {page.map((pageCategory) => {
              const category = pageCategory.category;
              const childCats = childCategoriesByParent[category.id] ?? [];
              const normalizedForId = norm(category.name);

              const isFridayMenu =
                (normalizedForId === "menu viernes" ||
                  normalizedForId === "almuerzo ejecutivo") &&
                ui.showFriday;

              const parentItems = filteredItems.filter(
                (item) =>
                  item.categoryId === category.id &&
                  pageCategory.itemIds.includes(item.id)
              );
              return (
                <div
                  id={
                    pageCategory.isFirstSegment
                      ? isFridayMenu
                        ? "menu-viernes"
                        : `cat-${category.id}`
                      : undefined
                  }
                  key={`${category.id}-${pageIndex}-${pageCategory.isFirstSegment ? "first" : "continued"}`}
                  className="relative scroll-mt-24 border-b border-[#fff7e3]/20 pb-6 last:border-b-0 last:pb-0"
                >
                  {pageCategory.isFirstSegment && (
                    <div className="space-y-1">
                      <div className="mb-4">
                        <h2
                          className="
                          mx-auto
                          w-fit
                          border-b
                          border-[#fff7e3]/70
                          pb-3
                          text-center
                          font-headline
                          text-2xl
                          font-normal
                          uppercase
                          tracking-[0.16em]
                          md:text-4xl
                        "
                          style={{ color: `hsl(${ui.categoryTitle})` }}
                        >
                          {category.name}
                        </h2>

                        {category.description && (
                          <p
                            className={
                              tenantId === "picania" && isFridayMenu
                                ? "mt-3 text-center text-[13px] md:text-[15px]"
                                : "mt-3 text-center text-sm"
                            }
                            style={{ color: `hsl(${ui.descriptionText})` }}
                          >
                            {category.description}
                          </p>
                        )}
                      </div>
                      <div className="h-px w-full bg-border/10" />
                    </div>
                  )}

                  <div className="divide-y divide-border/10">
                    {parentItems.map((item) => (
                      <div key={item.id} className="flow-root py-3">
                        {itemThumbnail(item)}
                        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3">
                          <div className="min-w-0">
                            <div className="flex items-baseline gap-2">
                              <span className="font-headline text-[13px] md:text-base tracking-wide">
                                {item.name}
                              </span>

                              {specialBadge(item)}
                              {sinTaccBadge(item)}

                              <div className="flex-1 border-b border-dotted border-foreground/20 mx-2" />
                            </div>

                            {item.description && (
                              <p
                                className="mt-1 text-xs md:text-sm leading-snug"
                                style={{ color: `hsl(${ui.descriptionText})` }}
                              >
                                {item.description}
                              </p>
                            )}
                          </div>

                          <span className="font-semibold text-sm md:text-base whitespace-nowrap">
                            {formatCurrency(item.price, tenantCurrency)}
                          </span>
                        </div>

                        {(item.tags ?? []).length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {(item.tags ?? [])
                              .filter((tag) => tag !== "sin TACC")
                              .map((tag) => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className="flex items-center gap-1 text-[11px] px-2 py-0.5"
                              >
                                <TagIcon tag={tag} />
                                <span>{tag}</span>
                              </Badge>
                              ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {childCats.map((sub) => {
                    const allSubItems = filteredItems.filter(
                      (item) => item.categoryId === sub.id
                    );
                    const itemsSub = allSubItems.filter((item) =>
                      pageCategory.itemIds.includes(item.id)
                    );
                    if (itemsSub.length === 0) return null;

                    const isIncluye = norm(sub.name) === "incluye";
                    const showSubTitle =
                      (isPulpo || sub.isVisible !== false) &&
                      itemsSub[0]?.id === allSubItems[0]?.id;

                    return (
                      <div key={sub.id} className="border-b border-border/10 pb-3">
                        {showSubTitle && (
                          <p
                            className="font-headline uppercase text-[15px] md:text-[18px] font-semibold tracking-[0.16em] pt-4 pb-2"
                            style={{ color: `hsl(${readableSubCategoryTitle})` }}
                          >
                            {sub.name}
                            {sub.description && (
                              <p
                                className="font-normal normal-case text-xs md:text-sm tracking-[0.16em] pb-2 pt-1"
                                style={{ color: `hsl(${ui.descriptionText})` }}
                              >
                                {sub.description}
                              </p>
                            )}

                          </p>
                        )}

                        <div className="divide-y divide-border/10">
                          {itemsSub.map((item) => {
                            const shownDesc =
                              isFridayMenu && isIncluye
                                ? fridayDescOverride(item.name, item.description, fridayData)
                                : item.description ?? "";

                            if (isFridayMenu && isIncluye) {
                              return (
                                <div key={item.id} className="flow-root py-3">
                                  {itemThumbnail(item)}
                                  <p>
                                    <span
                                      className="font-headline text-[13px] md:text-[15px] tracking-wide"
                                      style={{ color: "#FFF7E3" }}
                                    >
                                      {item.name}
                                    </span>

                                    {specialBadge(item)}
                                    {sinTaccBadge(item)}

                                    {": "}

                                    <span
                                      className="font-normal text-[13px] md:text-[15px] tracking-wide"
                                      style={{ color: `hsl(${ui.descriptionText})` }}
                                    >
                                      {(shownDesc || "—").replace(
                                        /^Agua o gaseosa linea Coca-Cola/i,
                                        "AGUA O GASEOSA LÍNEA COCA-COLA"
                                      )}
                                    </span>
                                  </p>
                                </div>
                              );
                            }

                            return (
                              <div
                                key={item.id}
                                className="flow-root py-3"
                              >
                                {itemThumbnail(item)}
                                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-2">
                                  <div className="flex min-w-0 items-baseline gap-2">
                                    <span className="font-headline text-[13px] md:text-base tracking-wide">
                                      {item.name}
                                    </span>

                                    {specialBadge(item)}
                                    {sinTaccBadge(item)}

                                    <div className="mx-2 flex-1 border-b border-dotted border-foreground/20" />
                                  </div>

                                  <span className="whitespace-nowrap text-sm font-semibold md:text-base">
                                    {formatCurrency(item.price, tenantCurrency)}
                                  </span>

                                  {shownDesc && (
                                    <p
                                      className="col-start-1 mt-1 max-w-3xl text-[13px] leading-snug md:text-[15px]"
                                      style={{ color: `hsl(${ui.descriptionText})` }}
                                    >
                                      {shownDesc}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
                  })}
                </div>
              </section>
            ))}

            {filteredItems.length === 0 && (
              <p className="text-sm text-center opacity-70">
                {copy.empty}
              </p>
            )}
          </div>
        </section>

        {openItemImage && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label={`Imagen de ${openItemImage.name}`}
            onClick={() => setOpenItemImage(null)}
          >
            <div
              className="relative max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-xl border shadow-2xl"
              style={{
                backgroundColor: `hsl(${ui.background})`,
                borderColor: `hsl(${ui.foreground} / 0.35)`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setOpenItemImage(null)}
                className="absolute right-3 top-3 z-10 rounded-full bg-black/70 p-2 text-white transition-transform hover:scale-110"
                aria-label="Cerrar imagen"
              >
                <X className="h-5 w-5" />
              </button>
              <img
                src={openItemImage.src}
                alt={openItemImage.name}
                className="max-h-[68vh] w-full object-contain"
              />
              <div className="p-4 md:p-5">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-headline text-lg md:text-xl">
                    {openItemImage.name}
                  </h3>
                  <span className="whitespace-nowrap font-semibold">
                    {formatCurrency(openItemImage.price, tenantCurrency)}
                  </span>
                </div>
                {openItemImage.description && (
                  <p
                    className="mt-2 text-sm leading-relaxed"
                    style={{ color: `hsl(${ui.descriptionText})` }}
                  >
                    {openItemImage.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

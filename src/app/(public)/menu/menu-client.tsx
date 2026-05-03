"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Leaf, Sparkles, PackageX, WheatOff, ChevronLeft, ChevronRight } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";

import { listenFridayData, type FridayData } from "@/lib/menu-viernes-service";
import type { Category, MenuItem } from "@/lib/types";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { listMenuItems } from "@/lib/menu-service";
import { listCategories } from "@/lib/categories-service";
import { getTenantUI } from "@/lib/tenant-ui";
import { db } from "@/lib/firebase";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles as SparklesIcon } from "lucide-react";

const formatCurrency = (price: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
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
  const [categoryNavIndex, setCategoryNavIndex] = useState(0);

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [search, setSearch] = useState("");

  const [ui, setUi] = useState(getTenantUI(""));
  const [uiReady, setUiReady] = useState(false);

  const [fridayData, setFridayData] = useState<FridayData>({
    entrada: "",
    postre: "",
  });

  const [mounted, setMounted] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [loadedSlides, setLoadedSlides] = useState<Record<number, boolean>>({});
  const [tenantCarouselImages, setTenantCarouselImages] = useState<string[]>([]);

  useEffect(() => {
    if (!tenantId) return;
    setUi(getTenantUI(tenantId));
    setUiReady(true);
  }, [tenantId]);

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
    (async () => {
      try {
        const data = await listMenuItems(tenantId);
        setMenuItems(data.filter((i) => i.isVisible !== false));
      } catch (e) {
        console.error("Error cargando menú desde Firestore", e);
      }
    })();
  }, [tenantId]);

  useEffect(() => {
    (async () => {
      try {
        const cats = await listCategories(tenantId);
        const ordered = cats.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setCategories(ordered);
      } catch (e) {
        console.error("Error cargando categorías desde Firestore", e);
      }
    })();
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
    () => categories.filter((c) => !c.parentCategoryId && c.isVisible !== false),
    [categories]
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
    ...(ui.showFriday ? [{ id: "menu-viernes", name: "ALMUERZO VIERNES" }] : []),
    ...visibleRootCategories
      .filter((cat) => {
        const n = norm(cat.name);
        return n !== "menu viernes" && n !== "almuerzo viernes";
      })
      .map((cat) => ({
        id: `cat-${cat.id}`,
        name: cat.name,
      })),
  ];

  const navScrollRef = useRef<HTMLDivElement | null>(null);

  const moveCategoryNav = (dir: "left" | "right") => {
    setCategoryNavIndex((prev) => {
      if (dir === "left") return Math.max(prev - 1, 0);
      return Math.min(prev + 1, categoryNavItems.length - 1);
    });
  };

  if (!uiReady) return null;



  return (
    <main className="min-h-screen bg-background">
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
                NUESTRA CARTA
              </h1>
  
              {categoryNavItems.length > 0 && (
                <div className="relative flex w-full items-center justify-center py-2">
                  {categoryNavIndex > 0 && (
                    <button
                      type="button"
                      onClick={() => moveCategoryNav("left")}
                      className="mr-7 flex items-center justify-center text-[hsl(var(--foreground))] opacity-90 hover:scale-110 transition-transform"
                      aria-label="Categoría anterior"
                    >
                      <ChevronLeft className="h-10 w-10 text-[hsl(var(--foreground))]" />
                    </button>
                  )}
  
                  <Button
                    onClick={() =>
                      scrollToSection(categoryNavItems[categoryNavIndex].id)
                    }
                    className="
                      w-[160px]
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
  
                      text-[hsl(var(--foreground))]
                      hover:text-[#1d2f59] dark:hover:text-[#fff7e3]
  
                      transition-colors
                    "
                  >
                    {categoryNavItems[categoryNavIndex].name}
                  </Button>
  
                  {categoryNavIndex < categoryNavItems.length - 1 && (
                    <button
                      type="button"
                      onClick={() => moveCategoryNav("right")}
                      className="ml-7 flex items-center justify-center text-[hsl(var(--foreground))] opacity-90 hover:scale-110 transition-transform"
                      aria-label="Categoría siguiente"
                    >
                      <ChevronRight className="h-10 w-10 text-[hsl(var(--foreground))]" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
  
          <div className="relative w-full max-w-xl mb-4">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por plato, ingrediente..."
              className="pl-10 border border-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-muted-foreground dark:border-muted-foreground/50"
            />
          </div>
        </div>
  
        <div className="space-y-10">
          {visibleRootCategories.map((category) => {
            const childCats = childCategoriesByParent[category.id] ?? [];
            const normalizedForId = norm(category.name);
  
            const isFridayMenu =
              (normalizedForId === "menu viernes" ||
                normalizedForId === "almuerzo viernes") &&
              ui.showFriday;
  
            const parentItems = filteredItems.filter(
              (item) => item.categoryId === category.id
            );
            return (
              <section
                id={isFridayMenu ? "menu-viernes" : `cat-${category.id}`}
                key={category.id}
                className="space-y-4 scroll-mt-24 md:scroll-mt-28"
              >
                <div className="space-y-1">
                  <h2
                    className="font-headline text-l md:text-xl lg:text-2xl tracking-widest font-bold mb-4 text-[#1d2f59] dark:text-[hsl(var(--muted-foreground))]"
                  >
                    {category.name}
                  </h2>
                  <div className="h-px w-full bg-border/10" />
                </div>

                <div className="divide-y divide-border/10">
                  {parentItems.map((item) => (
                    <div key={item.id} className="py-3">
                      <div className="flex items-baseline gap-2">
                        <span className="font-headline text-[15px] md:text-base tracking-wide">
                          {item.name}
                        </span>
                        {item.isSpecial && (
                          <Badge
                            variant="outline"
                            className="ml-2 flex items-center gap-1 text-[11px] px-2 py-0.5"
                          >
                            <SparklesIcon className="h-3 w-3" />
                            Especial
                          </Badge>
                        )}
                        <div className="flex-1 border-b border-dotted border-foreground/20 mx-2" />
                        <span className="font-semibold text-sm md:text-base whitespace-nowrap">
                          {formatCurrency(item.price)}
                        </span>
                      </div>

                      {item.description && (
                        <p className="mt-1 text-xs md:text-sm text-muted-foreground leading-snug max-w-3xl">
                          {item.description}
                        </p>
                      )}

                      {(item.tags ?? []).length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {(item.tags ?? []).map((tag) => (
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
                  const itemsSub = filteredItems.filter((item) => item.categoryId === sub.id);
                  if (itemsSub.length === 0) return null;

                  const isIncluye = norm(sub.name) === "incluye";
                  const showSubTitle = sub.isVisible !== false;

                  return (
                    <div key={sub.id} className="border-b border-border/10 pb-3">
                      {showSubTitle && (
                        <p className="font-headline uppercase text-[11px] md:text-xs font-semibold tracking-[0.16em] pt-4 pb-2 text-muted-foreground">
                          {sub.name}
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
                              <div key={item.id} className="py-3">
                                <p className="font-headline text-[15px] md:text-base tracking-wide">
                                  <span className="font-headline text-[15px] md:text-base tracking-wide text-foreground">{item.name}:</span>{" "}
                                  <span className="opacity-80">{shownDesc || "—"}</span>
                                </p>
                              </div>
                            );
                          }

                          return (
                            <div key={item.id} className="py-3">
                              <div className="flex items-baseline gap-2">
                                <span className="font-headline text-[15px] md:text-base tracking-wide">
                                  {item.name}
                                </span>
                                <div className="flex-1 border-b border-dotted border-foreground/20 mx-2" />
                                <span className="font-semibold text-sm md:text-base whitespace-nowrap">
                                  {formatCurrency(item.price)}
                                </span>
                              </div>

                              {shownDesc && (
                                <p className="mt-1 text-xs md:text-sm text-muted-foreground leading-snug max-w-3xl">
                                  {shownDesc}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </section>
            );
          })}

          {filteredItems.length === 0 && (
            <p className="text-sm text-center opacity-70">
              No encontramos platos que coincidan con la búsqueda.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
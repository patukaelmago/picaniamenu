"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Leaf, Sparkles, PackageX, WheatOff } from "lucide-react";
import Link from "next/link";

import { getFridayData, type FridayData } from "@/lib/menu-viernes-service";
import type { Category, MenuItem } from "@/lib/types";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { listMenuItems } from "@/lib/menu-service";
import { listCategories } from "@/lib/categories-service";

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

/**
 * Si estamos en Menú Viernes > Incluye:
 * - Para "Entrada" y "Postre o café" mostramos lo que viene de fridayData (admin)
 * - Para "Bebida" dejamos la description original del item
 */
function fridayDescOverride(
  itemName: string,
  originalDesc: string | undefined,
  fridayData: FridayData
) {
  const n = norm(itemName);

  if (n === "entrada") return fridayData?.entrada ?? "";
  if (n === "postre o cafe" || n === "postre" || n === "cafe")
    return fridayData?.postre ?? "";

  // Bebida u otros: mantener lo que estaba en el item
  return originalDesc ?? "";
}

export default function MenuClient() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [search, setSearch] = useState("");

  // ✅ datos del menú viernes (entrada/postre)
  const [fridayData, setFridayData] = useState<FridayData>({
    entrada: "",
    postre: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const data = await getFridayData();
        setFridayData({
          entrada: data?.entrada ?? "",
          postre: data?.postre ?? "",
        });
      } catch (e) {
        console.error("Error cargando menu_viernes/data", e);
      }
    })();
  }, []);

  // ✅ FIX HYDRATION: render del carrusel sólo luego del mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // ====== CAROUSEL STATE ======
  const [activeSlide, setActiveSlide] = useState(0);

  // ====== LOAD DATA ======
  useEffect(() => {
    (async () => {
      try {
        const data = await listMenuItems();
        setMenuItems(data.filter((i) => i.isVisible !== false));
      } catch (e) {
        console.error("Error cargando menú desde Firestore", e);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const cats = await listCategories();
        const ordered = cats
          .filter((c) => c.isVisible !== false)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setCategories(ordered);
      } catch (e) {
        console.error("Error cargando categorías desde Firestore", e);
      }
    })();
  }, []);

  // ====== ROOT vs SUBCATEGORIES ======
  const rootCategories = useMemo(
    () => categories.filter((c) => !c.parentCategoryId),
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

  // IDs válidos cuando hay categoría seleccionada (raíz + hijos)
  const selectedCategoryIds = useMemo(() => {
    if (selectedCategory === "all") return null;

    const children = categories
      .filter((c) => c.parentCategoryId === selectedCategory)
      .map((c) => c.id);

    return [selectedCategory, ...children];
  }, [selectedCategory, categories]);

  // ====== FILTERING (incluye nombre de categoría y categoría padre) ======
  const filteredItems = useMemo(() => {
    const term = search.toLowerCase().trim();

    return menuItems.filter((item) => {
      if (!item.isVisible) return false;

      if (
        selectedCategoryIds &&
        !selectedCategoryIds.includes(item.categoryId)
      ) {
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

      const matchesCategory =
        catName.includes(term) || parentCatName.includes(term);

      return matchesText || matchesCategory;
    });
  }, [menuItems, selectedCategoryIds, search, categories]);

  const visibleRootCategories = useMemo(() => {
    const isSuggestion = (name: string) => norm(name) === "sugerencia del dia";

    if (selectedCategory !== "all") {
      return rootCategories.filter(
        (c) => c.id === selectedCategory && !isSuggestion(c.name)
      );
    }

    return rootCategories
      .filter((c) => !isSuggestion(c.name)) // 🚫 no renderiza “Sugerencia del día” abajo
      .filter((cat) => {
        const childCats = childCategoriesByParent[cat.id] ?? [];
        const hasDirectItems = filteredItems.some(
          (item) => item.categoryId === cat.id
        );
        const hasChildItems = childCats.some((sub) =>
          filteredItems.some((item) => item.categoryId === sub.id)
        );
        return hasDirectItems || hasChildItems;
      });
  }, [rootCategories, childCategoriesByParent, filteredItems, selectedCategory]);

  // ====== CAROUSEL IMAGES (toma imágenes de "Sugerencia del día") ======
  const carouselImages = useMemo(() => {
    const sugCat = categories.find((c) => norm(c.name) === "sugerencia del dia");

    const items = sugCat
      ? menuItems.filter(
          (i) => i.categoryId === sugCat.id && i.isVisible !== false
        )
      : [];

    const imgs = items
      .map((item) => {
        const ph = PlaceHolderImages.find((p) => p.id === item.imageId);
        const src = ph?.imageUrl || item.imageUrl || "/img/placeholder.jpg";
        return { src, alt: item.name, hint: ph?.imageHint };
      })
      .slice(0, 6);

    if (imgs.length === 0) {
      return [
        { src: "/img/placeholder.jpg", alt: "Plato", hint: "food" as any },
        { src: "/img/placeholder.jpg", alt: "Postre", hint: "dessert" as any },
      ];
    }

    return imgs;
  }, [categories, menuItems]);

  // autoplay suave
  useEffect(() => {
    if (!mounted) return;
    if (!carouselImages?.length) return;

    setActiveSlide((prev) => (prev >= carouselImages.length ? 0 : prev));

    const id = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % carouselImages.length);
    }, 4500);

    return () => window.clearInterval(id);
  }, [carouselImages, mounted]);

  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto max-w-5xl px-4 pt-8 pb-8 space-y-6">
        {/* ====== CARRUSEL ARRIBA ====== */}
        {mounted && (
          <div className="w-full">
            <div className="relative overflow-hidden rounded-xl border border-[rgba(0,0,0,0.08)] dark:border-[#fff7e3]/20 shadow-sm">
              <div className="relative h-[220px] md:h-[320px] w-full">
                {carouselImages.map((img, idx) => (
                  <img
                    key={`${img.src}-${idx}`}
                    src={img.src}
                    alt={img.alt}
                    data-ai-hint={img.hint}
                    className={[
                      "absolute inset-0 h-full w-full object-cover",
                      "transition-opacity duration-700 ease-out",
                      idx === activeSlide ? "opacity-100" : "opacity-0",
                    ].join(" ")}
                  />
                ))}
              </div>

              {/* puntitos discretos */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                {carouselImages.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Ir a imagen ${i + 1}`}
                    onClick={() => setActiveSlide(i)}
                    className={[
                      "h-1.5 w-1.5 rounded-full transition-all",
                      i === activeSlide
                        ? "bg-[#fff7e3] dark:bg-[#fff7e3]"
                        : "bg-[#fff7e3]/50 dark:bg-[#fff7e3]/40",
                    ].join(" ")}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* encabezado + buscador */}
        <div className="flex flex-col gap-4 items-center text-center">
          <div className="w-full">
            <div className="grid w-full items-center gap-3 md:grid-cols-[1fr_auto_1fr]">
              <div className="hidden md:block" />
              <h1 className="pt-8 text-md md:text-xl xl:text-3xl font-headline tracking-[0.3em] uppercase text-center ">
                Nuestra Carta
              </h1>

              <div className="flex justify-center md:justify-end pt-8 ">
                <Button
                  asChild
                  className="
                    rounded-sm
                    px-5
                    py-2
                    border
                    bg-[#1b3059]
                    text-[#fff7e3]
                    border-[#1b3059]
                    opacity-90
                    hover:scale-[1.03]
                    hover:bg-[#223c6f]
                    hover:opacity-100
                    dark:bg-[#fff7e3]
                    dark:text-[#1b3059]
                    dark:border-[#fff7e3]
                    transition-all
                    duration-200
                    ease-out
                  "
                >
                  <Link
                    href="/menu#menu-viernes"
                    className="flex items-center gap-2"
                  >
                    Almuerzo Viernes
                    <span className="text-xs opacity-60">▾</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="relative w-full max-w-xl">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por plato, ingrediente..."
              className="
                pl-9
                bg-transparent
                dark:bg-transparent
                text-[#1d2f59]
                dark:text-[#fff7e3]
                placeholder:text-[#1d2f59]/60
                dark:placeholder:text-[#fff7e3]/70
                border
                border-[#1d2f59]/30
                dark:border-[#fff7e3]/40
                focus-visible:ring-0
                focus-visible:border-[#1d2f59]/60
                dark:focus-visible:border-[#fff7e3]
                focus:bg-transparent
                dark:focus:bg-transparent
              "
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* secciones por categoría raíz */}
        <div className="space-y-10">
          {visibleRootCategories.map((category) => {
            const childCats = childCategoriesByParent[category.id] ?? [];

            const normalizedForId = norm(category.name);

            const isFridayMenu =
              normalizedForId === "menu viernes" ||
              normalizedForId === "almuerzo viernes";

            return (
              <section
                id={isFridayMenu ? "menu-viernes" : undefined}
                key={category.id}
                className="space-y-4 scroll-mt-24 md:scroll-mt-28"
              >
                <div className="space-y-1">
                  {/* ✅ CATEGORÍA PADRE: crema en dark */}
                  <h2
                    className="
                      text-sm md:text-base 
                      tracking-[0.25em] 
                      uppercase 
                      font-semibold
                      text-[#1b3059]
                      dark:text-[#fff7e3]
                    "
                  >
                    {category.name}
                  </h2>

                  <div className="h-px w-full bg-[rgba(0,0,0,0.08)] dark:bg-[#fff7e3]/30" />
                </div>

                {/* CON SUBCATEGORÍAS / SIN SUBCATEGORÍAS */}
                {childCats.length === 0 ? (
                  <div
                    className="
                      divide-y
                      divide-[rgba(0,0,0,0.06)]
                      dark:divide-[#fff7e3]/25
                    "
                  >
                    {filteredItems
                      .filter((item) => item.categoryId === category.id)
                      .map((item) => (
                        <div key={item.id} className="py-3">
                          <div className="flex items-baseline gap-2">
                            {/* ✅ ITEM: crema en dark */}
                            <span className="font-headline text-[15px] md:text-base tracking-wide text-[#1d2f59] dark:text-[#fff7e3]">
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

                            <div
                              className="
                                flex-1
                                border-b
                                border-dotted
                                border-[rgba(0,0,0,0.35)]
                                dark:border-[rgba(255,247,227,0.35)]
                                mx-2
                              "
                            />

                            <span className="font-semibold text-sm md:text-base whitespace-nowrap text-[#1d2f59] dark:text-[#fff7e3]">
                              {formatCurrency(item.price)}
                            </span>
                          </div>

                          {/* ✅ DESCRIPCIÓN: dorado en dark */}
                          {item.description && (
                            <p className="mt-1 text-xs md:text-sm text-muted-foreground dark:text-[#d9b36c] leading-snug max-w-3xl">
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
                ) : (
                  <div className="space-y-6">
                    {childCats.map((sub) => {
                      const itemsSub = filteredItems.filter(
                        (item) => item.categoryId === sub.id
                      );
                      if (itemsSub.length === 0) return null;

                      const isIncluye = norm(sub.name) === "incluye";

                      return (
                        <div
                          key={sub.id}
                          className="border-b border-[rgba(0,0,0,0.08)] pb-3"
                        >
                          {/* subcategoría: dorado en dark (queda igual que ya estaba) */}
                          <p
                            className="font-headline 
                              uppercase 
                              text-[11px]
                              md:text-xs
                              font-semibold
                              tracking-[0.16em]
                              pt-4 
                              pb-2
                              text-[rgba(0,0,0,0.7)]
                              dark:text-[#d9b36c]"
                          >
                            {sub.name}
                          </p>

                          <div
                            className="
                              divide-y
                              divide-[rgba(0,0,0,0.06)]
                              dark:divide-[#fff]/25
                            "
                          >
                            {itemsSub.map((item) => {
                              const shownDesc =
                                isFridayMenu && isIncluye
                                  ? fridayDescOverride(
                                      item.name,
                                      item.description,
                                      fridayData
                                    )
                                  : item.description ?? "";

                              // ✅ INCLUYE (Menú Viernes): sin precio, sin línea, formato "Bebida: ..."
                              if (isFridayMenu && isIncluye) {
                                return (
                                  <div key={item.id} className="py-3">
                                    <p className="text-sm md:text-base text-[#1d2f59] dark:text-[#fff7e3]">
                                      <span className="font-semibold text-[#1d2f59] dark:text-[#fff7e3]">
                                        {item.name}:
                                      </span>{" "}
                                      {/* ✅ DESCRIPCIÓN INCLUYE: dorado en dark */}
                                      <span className="text-[#1d2f59]/80 dark:text-[#d9b36c]">
                                        {shownDesc || "—"}
                                      </span>
                                    </p>
                                    <div className="h-px w-full bg-[rgba(255,255,255,0.10)]" />
                                  </div>
                                );
                              }

                              // ✅ resto: como siempre (con precio)
                              return (
                                <div key={item.id} className="py-3">
                                  <div className="flex items-baseline gap-2">
                                    {/* ✅ ITEM: crema en dark */}
                                    <span className="font-headline text-[15px] md:text-base tracking-wide text-[#1d2f59] dark:text-[#fff7e3]">
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

                                    <div
                                      className="
                                        flex-1
                                        border-b
                                        border-dotted
                                        border-[rgba(0,0,0,0.35)]
                                        dark:border-[rgba(255,247,227,0.35)]
                                        mx-2
                                      "
                                    />

                                    <span className="font-semibold text-sm md:text-base whitespace-nowrap text-[#1d2f59] dark:text-[#fff7e3]">
                                      {formatCurrency(item.price)}
                                    </span>
                                  </div>

                                  {/* ✅ DESCRIPCIÓN: dorado en dark */}
                                  {shownDesc && (
                                    <p className="mt-1 text-xs md:text-sm text-muted-foreground dark:text-[#d9b36c] leading-snug max-w-3xl">
                                      {shownDesc}
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
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}

          {filteredItems.length === 0 && (
            <p
              className="
                text-sm
                text-center
                text-[#1d2f59]/70
                dark:text-[#fff7e3]/70
              "
            >
              No encontramos platos que coincidan con la búsqueda.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

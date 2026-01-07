"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Leaf, Sparkles, PackageX, WheatOff } from "lucide-react";
import Link from "next/link";

import type { Category, MenuItem } from "@/lib/types";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { listMenuItems } from "@/lib/menu-service";
import { listCategories } from "@/lib/categories-service";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

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

export default function MenuClient() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [search, setSearch] = useState("");

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

      // si no hay término, ya está filtrado por visibilidad/categoría
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
    if (selectedCategory !== "all") {
      return rootCategories.filter((c) => c.id === selectedCategory);
    }

    return rootCategories.filter((cat) => {
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

  return (
    <main className="min-h-screen bg-background">
     <section className="mx-auto max-w-5xl px-4 pt-12 pb-8 space-y-6">
        {/* encabezado + buscador */}
        <div className="flex flex-col gap-4 items-center text-center">
          {/* FILA: titulo centrado REAL + boton a la derecha del container */}
          <div className="w-full">
            <div className="grid w-full items-center gap-3 md:grid-cols-[1fr_auto_1fr]">
              {/* Columna izquierda vacía (balance) */}
              <div className="hidden md:block" />

              {/* Título centrado */}
              <h1 className="text-md md:text-xl xl:text-3xl font-headline tracking-[0.3em] uppercase text-center">
                Nuestra Carta
              </h1>

              {/* Botón a la derecha */}
              <div className="flex justify-center md:justify-end">
                <Button
                  variant="ghost"
                  asChild
                  className="
                    rounded-sm
                    px-5
                    py-2
                    border
                    bg-transparent
                    opacity-85

                    /* ☀️ MODO CLARO */
                    border-[rgba(0,0,0,0.18)]
                    text-[#1d2f59]
                    hover:opacity-100
                    hover:bg-[#1b3059]/5
                    hover:text-[#1d2f59]
                    hover:border-[#1d2f59]/30

                    /* 🌙 MODO OSCURO */
                    dark:border-[#fff7e3]/40
                    dark:text-[#fff7e3]
                    dark:hover:bg-[#fff7e3]/10
                    dark:hover:text-[#fff7e3]
                    dark:hover:border-[#fff7e3]/70

                    transition-all
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

    /* fondo */
    bg-transparent
    dark:bg-transparent

    /* texto */
    text-[#1d2f59]
    dark:text-[#fff7e3]

    /* placeholder */
    placeholder:text-[#1d2f59]/60
    dark:placeholder:text-[#fff7e3]/70

    /* borde normal */
    border
    border-[#1d2f59]/30
    dark:border-[#fff7e3]/40

    /* focus: mismo grosor, color crema */
    focus-visible:ring-0
    focus-visible:border-[#1d2f59]/60
    dark:focus-visible:border-[#fff7e3]

    /* evitar fondo automático */
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

            // detectar "SUGERENCIA DEL DÍA" aunque tenga mayúsculas y tilde
            const normalizedName = category.name
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "");
            const showImageForCategory = normalizedName === "sugerencia del dia";

            // normalizamos también para decidir el id del anchor (viernes)
            const normalizedForId = category.name
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "");

            return (
              <section
                id={
                  normalizedForId === "menu viernes" ||
                  normalizedForId === "almuerzo viernes"
                    ? "menu-viernes"
                    : undefined
                }
                key={category.id}
                className="space-y-4 scroll-mt-24 md:scroll-mt-28"
              >
                {/* encabezado categoría raíz (MÁS GRANDE) */}
                <div className="space-y-1">
                  <h2
                    className="
                      text-sm md:text-base 
                      tracking-[0.25em] 
                      uppercase 
                      font-semibold
                      text-[#1b3059]
                      dark:text-[#d9b36c]
                    "
                  >
                    {category.name}
                  </h2>

                  <div className="h-px w-full bg-[rgba(0,0,0,0.08)] dark:bg-[#fff7e3]/30" />
                </div>

                {/* SIN subcategorías */}
                {childCats.length === 0 ? (
                  showImageForCategory ? (
                    // SUGERENCIA DEL DÍA = cards con imagen
                    <div className="grid gap-6 md:grid-cols-2">
                      {filteredItems
                        .filter((item) => item.categoryId === category.id)
                        .map((item) => {
                          const image = PlaceHolderImages.find(
                            (p) => p.id === item.imageId
                          );

                          const src =
                            image?.imageUrl ||
                            item.imageUrl ||
                            "/img/placeholder.jpg";

                          return (
                            <Card
                              key={item.id}
                              className="overflow-hidden flex flex-col h-full border border-[rgba(0,0,0,0.08)] shadow-sm"
                            >
                              <div className="relative h-52 w-full">
                                <img
                                  src={src}
                                  alt={item.name}
                                  className="object-cover w-full h-full"
                                  data-ai-hint={image?.imageHint}
                                />
                              </div>

                              <CardHeader>
                                <div className="flex items-center gap-2">
                                  <CardTitle className="font-headline tracking-[0.12em] uppercase text-sm">
                                    {item.name}
                                  </CardTitle>
                                  {item.isSpecial && (
                                    <Badge className="flex items-center gap-1 rounded-sm">
                                      <Sparkles className="h-3.5 w-3.5" />
                                      Especial
                                    </Badge>
                                  )}
                                </div>
                                <CardDescription className="text-xs leading-snug text-muted-foreground dark:text-[#fff7e3]">
                                  {item.description}
                                </CardDescription>
                              </CardHeader>

                              <CardContent className="mt-auto space-y-3">
                                <div className="flex flex-wrap gap-2">
                                  {(item.tags ?? []).map((tag) => (
                                    <Badge
                                      key={tag}
                                      variant="outline"
                                      className="flex items-center gap-1 text-[11px]"
                                    >
                                      <TagIcon tag={tag} />
                                      <span>{tag}</span>
                                    </Badge>
                                  ))}
                                </div>

                                <div className="flex items-center justify-end">
                                  <span className="text-base font-semibold">
                                    {formatCurrency(item.price)}
                                  </span>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                    </div>
                  ) : (
                    // CATEGORÍAS SIN SUBCATEGORÍAS → estilo carta
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
                              <span className="font-headline text-[15px] md:text-base tracking-wide">
                                {item.name}
                              </span>
                              {item.isSpecial && (
                                <Badge
                                  variant="outline"
                                  className="ml-2 flex items-center gap-1 text-[11px] px-2 py-0.5"
                                >
                                  <Sparkles className="h-3 w-3" />
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


                              <span className="font-semibold text-sm md:text-base whitespace-nowrap">
                                {formatCurrency(item.price)}
                              </span>
                            </div>

                            {item.description && (
                              <p className="mt-1 text-xs md:text-sm text-muted-foreground dark:text-[#fff7e3] leading-snug max-w-3xl">
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
                  )
                ) : (
                  // CON SUBCATEGORÍAS → SIEMPRE ABIERTAS
                  <div className="space-y-6">
                    {childCats.map((sub) => {
                      const itemsSub = filteredItems.filter(
                        (item) => item.categoryId === sub.id
                      );
                      if (itemsSub.length === 0) return null;

                      return (
                        <div
                          key={sub.id}
                          className="border-b border-[rgba(0,0,0,0.08)] pb-3"
                        >
                          {/* título subcategoría (UN PASO MÁS CHICO) */}
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
                            {itemsSub.map((item) => (
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
                                      <Sparkles className="h-3 w-3" />
                                      Especial
                                    </Badge>
                                  )}
                                  <div
  className="
    flex-1
    border-b
    border-dotted
    border-[#545454)]
    dark:border-b-[#1b1a19]
    mx-2
  "
/>



                                  <span className="font-semibold text-sm md:text-base whitespace-nowrap">
                                    {formatCurrency(item.price)}
                                  </span>
                                </div>

                                {item.description && (
                                  <p className="mt-1 text-xs md:text-sm text-muted-foreground dark:text-[#fff7e3] leading-snug max-w-3xl">
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

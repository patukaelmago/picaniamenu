"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Leaf, Sparkles, PackageX, WheatOff } from "lucide-react";

import type { Category, MenuItem } from "@/lib/types";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { listMenuItems } from "@/lib/menu-service";
import { listCategories } from "@/lib/categories-service";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

const formatCurrency = (price: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
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

  // ====== FILTERING ======
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (!item.isVisible) return false;

      if (
        selectedCategoryIds &&
        !selectedCategoryIds.includes(item.categoryId)
      ) {
        return false;
      }

      const term = search.toLowerCase().trim();
      if (!term) return true;

      const desc = item.description?.toLowerCase() ?? "";

      return (
        item.name.toLowerCase().includes(term) ||
        desc.includes(term) ||
        (item.searchKeywords ?? []).some((k) =>
          k.toLowerCase().includes(term)
        )
      );
    });
  }, [menuItems, selectedCategoryIds, search]);

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
      <section className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        {/* encabezado + buscador */}
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-headline font-bold">Menú</h1>
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por plato, ingrediente..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* chips de categorías */}
        <div
          className="flex gap-2 overflow-x-auto no-scrollbar py-1 w-full
                     md:flex-wrap md:overflow-visible"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <button
            type="button"
            className={cn(
              "rounded-sm border px-4 py-1 text-sm whitespace-nowrap",
              selectedCategory === "all"
                ? "bg-foreground text-background"
                : "bg-background text-foreground"
            )}
            onClick={() => setSelectedCategory("all")}
          >
            Todos
          </button>
          {rootCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={cn(
                "rounded-sm border px-4 py-1 text-sm whitespace-nowrap",
                selectedCategory === cat.id
                  ? "bg-foreground text-background"
                  : "bg-background text-foreground"
              )}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
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

            return (
              <section key={category.id} className="space-y-4">
                <h2 className="text-2xl font-headline font-semibold">
                  {/* {category.name} */}
                </h2>

                {/* SIN subcategorías */}
                {childCats.length === 0 ? (
                  showImageForCategory ? (
                    // SUGERENCIA DEL DIA = cards con imagen
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
                              className="overflow-hidden flex flex-col h-full"
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
                                  <CardTitle>{item.name}</CardTitle>
                                  {item.isSpecial && (
                                    <Badge className="flex items-center gap-1 rounded-sm">
                                      <Sparkles className="h-3.5 w-3.5" />
                                      Especial
                                    </Badge>
                                  )}
                                </div>
                                <CardDescription>
                                  {item.description}
                                </CardDescription>
                              </CardHeader>
                              <CardContent className="mt-auto space-y-3">
                                <div className="flex flex-wrap gap-2">
                                  {(item.tags ?? []).map((tag) => (
                                    <Badge
                                      key={tag}
                                      variant="outline"
                                      className="flex items-center gap-1"
                                    >
                                      <TagIcon tag={tag} />
                                      <span>{tag}</span>
                                    </Badge>
                                  ))}
                                </div>

                                <div className="flex items-center justify-between">
                                  <span className="text-lg font-semibold">
                                    {formatCurrency(item.price)}
                                  </span>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                    </div>
                  ) : (
                    // RESTO SIN SUBCATEGORÍAS
                    <div className="border-t divide-y">
                      {filteredItems
                        .filter((item) => item.categoryId === category.id)
                        .map((item) => (
                          <div
                            key={item.id}
                            className="flex items-baseline justify-between gap-4 py-3"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-headline font-semibold tracking-wide uppercase text-sm md:text-base">
                                  {item.name}
                                </span>
                                {item.isSpecial && (
                                  <Badge
                                    variant="outline"
                                    className="flex items-center gap-1 text-[11px] px-2 py-0.5"
                                  >
                                    <Sparkles className="h-3 w-3" />
                                    Especial
                                  </Badge>
                                )}
                              </div>
                              {item.description && (
                                <p className="text-sm text-muted-foreground leading-snug">
                                  {item.description}
                                </p>
                              )}
                            </div>

                            <div className="text-right min-w-[90px]">
                              <span className="font-semibold text-base md:text-lg">
                                {formatCurrency(item.price)}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  )
                ) : (
                  // CON SUBCATEGORÍAS → acordeón
                  <Accordion type="multiple" className="w-full space-y-2">
                    {childCats.map((sub) => {
                      const itemsSub = filteredItems.filter(
                        (item) => item.categoryId === sub.id
                      );
                      if (itemsSub.length === 0) return null;

                      return (
                        <AccordionItem
                          key={sub.id}
                          value={sub.id}
                          className="border-b"
                        >
                          <AccordionTrigger
                            className="font-headline tracking-wide uppercase text-sm md:text-base text-left no-underline hover:no-underline focus:no-underline"
                            style={{ textDecoration: "none" }}
                          >
                            {sub.name}
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="divide-y">
                              {itemsSub.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-baseline justify-between gap-4 py-3"
                                >
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-headline font-semibold uppercase text-blue text-sm md:text-base text-bold">
                                        {item.name}
                                      </span>
                                      {item.isSpecial && (
                                        <Badge
                                          variant="outline"
                                          className="flex items-center gap-1 text-[11px] px-2 py-0.5"
                                        >
                                          <Sparkles className="h-3 w-3" />
                                          Especial
                                        </Badge>
                                      )}
                                    </div>
                                    {item.description && (
                                      <p className="text-sm text-muted-foreground leading-snug">
                                        {item.description}
                                      </p>
                                    )}
                                  </div>

                                  <div className="text-right min-w-[90px]">
                                    <span className="font-semibold text-base md:text-lg">
                                      {formatCurrency(item.price)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                )}
              </section>
            );
          })}

          {filteredItems.length === 0 && (
            <p className="text-muted-foreground">
              No encontramos platos que coincidan con la búsqueda.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

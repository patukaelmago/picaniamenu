'use client';

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
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
  // ====== STATE ======
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [search, setSearch] = useState("");

  // ====== LOAD DATA ======
  useEffect(() => {
    (async () => {
      try {
        const data = await listMenuItems();
        // dejamos de filtrar por inStock - solo isVisible
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

  // ====== FILTERING ======
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (!item.isVisible) return false;

      if (selectedCategory !== "all" && item.categoryId !== selectedCategory) {
        return false;
      }

      const term = search.toLowerCase().trim();
      if (!term) return true;

      return (
        item.name.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term) ||
        (item.searchKeywords ?? []).some((k) =>
          k.toLowerCase().includes(term)
        )
      );
    });
  }, [menuItems, selectedCategory, search]);

  // categorías que tienen al menos un plato filtrado
  const visibleCategories = useMemo(() => {
    if (selectedCategory !== "all") {
      return categories.filter((c) => c.id === selectedCategory);
    }
    return categories.filter((cat) =>
      filteredItems.some((item) => item.categoryId === cat.id)
    );
  }, [categories, filteredItems, selectedCategory]);

  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        {/* encabezado + buscador */}
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-headline font-bold">Menú</h1>
          <p className="text-muted-foreground">
            Descubrí nuestros platos, filtrá por categoría o buscá por ingrediente.
          </p>

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
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={cn(
              "rounded-full border px-4 py-1 text-sm",
              selectedCategory === "all"
                ? "bg-foreground text-background"
                : "bg-background text-foreground"
            )}
            onClick={() => setSelectedCategory("all")}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={cn(
                "rounded-full border px-4 py-1 text-sm",
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

        {/* secciones por categoría */}
        <div className="space-y-10">
          {visibleCategories.map((category) => {
            const itemsDeCat = filteredItems.filter(
              (item) => item.categoryId === category.id
            );
            if (itemsDeCat.length === 0) return null;

            return (
              <section key={category.id} className="space-y-4">
                <h2 className="text-2xl font-headline font-semibold">
                  {category.name}
                </h2>

                <div className="grid gap-6 md:grid-cols-2">
                  {itemsDeCat.map((item) => {
                    const image = PlaceHolderImages.find(
                      (p) => p.id === item.imageId
                    );

                    return (
                      <Card
                        key={item.id}
                        className="overflow-hidden flex flex-col h-full"
                      >
                        {image ? (
                          <div className="relative h-52 w-full">
                            <Image
                              src={image.imageUrl}
                              alt={item.name}
                              fill
                              className="object-cover"
                              data-ai-hint={image.imageHint}
                            />
                          </div>
                        ) : (
                          <div className="h-16 w-full bg-muted flex items-center px-4 text-sm text-muted-foreground">
                            Sin imagen
                          </div>
                        )}

                        <CardHeader>
                          <div className="flex items-center gap-2">
                            <CardTitle>{item.name}</CardTitle>
                            {item.isSpecial && (
                              <Badge className="flex items-center gap-1">
                                <Sparkles className="h-3.5 w-3.5" />
                                Especial
                              </Badge>
                            )}
                          </div>
                          <CardDescription>{item.description}</CardDescription>
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

'use client';
/*
import { useState, useMemo } from 'react';
import type { Category, MenuItem } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Search, Leaf, Sparkles, PackageX, WheatOff } from 'lucide-react';
import { cn } from '@/lib/utils';

type MenuClientProps = {
  categories: Category[];
  menuItems: MenuItem[];
};

const formatCurrency = (price: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(price);
};

const TagIcon = ({ tag }: { tag: string }) => {
  switch (tag) {
    case 'Especial':
      return <Sparkles className="h-4 w-4 text-accent" />;
    case 'Sin stock':
      return <PackageX className="h-4 w-4 text-destructive" />;
    case 'sin TACC':
      return <WheatOff className="h-4 w-4 text-blue-500" />;
    case 'veggie':
      return <Leaf className="h-4 w-4 text-green-500" />;
    default:
      return null;
  }
};

export default function MenuClient({ categories, menuItems }: MenuClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredMenuItems = useMemo(() => {
    return menuItems
      .filter(item => {
        const matchesSearch =
          searchTerm === '' ||
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.searchKeywords.some(kw => kw.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesCategory =
          selectedCategory === null || item.categoryId === selectedCategory;

        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => a.order - b.order);
  }, [searchTerm, selectedCategory, menuItems]);

  const displayedCategories = useMemo(() => {
    const itemCategoryIds = new Set(filteredMenuItems.map(item => item.categoryId));
    return categories.filter(cat => itemCategoryIds.has(cat.id));
  }, [filteredMenuItems, categories]);

  return (
    <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl md:text-5xl font-headline font-bold">Nuestro Menú</h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Descubrí los sabores de nuestra parrilla, con ingredientes frescos y la pasión de siempre.
        </p>
      </div>

      <div className="sticky top-20 bg-background/95 z-30 py-4 mb-8">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por plato, ingrediente..."
            className="pl-10 w-full"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Badge
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "cursor-pointer transition-colors text-sm",
              selectedCategory === null ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            )}
          >
            Todos
          </Badge>
          {categories.map(category => (
            <Badge
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={cn(
                "cursor-pointer transition-colors text-sm",
                selectedCategory === category.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              )}
            >
              {category.name}
            </Badge>
          ))}
        </div>
      </div>

      {displayedCategories.length > 0 ? (
        <div className="space-y-16">
          {displayedCategories.map(category => (
            <section key={category.id} id={category.name.toLowerCase()}>
              <h2 className="text-3xl font-headline font-semibold mb-8 border-b-2 border-accent pb-2">
                {category.name}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredMenuItems
                  .filter(item => item.categoryId === category.id)
                  .map(item => {
                    const placeholder = PlaceHolderImages.find(p => p.id === item.imageId);
                    return (
                      <Card key={item.id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <CardHeader className="p-0">
                          <div className="aspect-video relative">
                            {placeholder && (
                              <Image
                                src={placeholder.imageUrl}
                                alt={item.name}
                                data-ai-hint={placeholder.imageHint}
                                fill
                                className="object-cover"
                              />
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="flex-grow p-6">
                          <CardTitle className="font-headline text-2xl mb-2">{item.name}</CardTitle>
                          <CardDescription>{item.description}</CardDescription>
                        </CardContent>
                        <CardFooter className="flex flex-col items-start p-6 pt-0">
                           <div className="flex flex-wrap gap-2 mb-4">
                            {item.tags.map(tag => (
                              <Badge key={tag} variant={tag === 'Especial' || tag === 'Sin stock' ? 'destructive' : 'secondary'} className="flex items-center gap-1">
                                <TagIcon tag={tag} />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-2xl font-bold text-foreground self-end">{formatCurrency(item.price)}</p>
                        </CardFooter>
                      </Card>
                    );
                  })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">No se encontraron platos con esos criterios.</p>
        </div>
      )}
    </div>
  );
}
*/

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Search, Leaf, Sparkles, PackageX, WheatOff } from "lucide-react";

import { CATEGORIES } from "@/lib/data";
import type { Category, MenuItem } from "@/lib/types";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { listMenuItems } from "@/lib/menu-service";

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

const formatCurrency = (price: number) => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(price);
};

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
  const [categories] = useState<Category[]>(CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [search, setSearch] = useState("");

  // cargar platos desde Firestore
  useEffect(() => {
    const load = async () => {
      try {
        const data = await listMenuItems();
        setMenuItems(data);
      } catch (e) {
        console.error("Error cargando menú desde Firestore", e);
      }
    };
    load();
  }, []);

  // filtros: visible, en stock, categoría y búsqueda
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (!item.isVisible) return false;
      if (!item.inStock) return false;

      if (selectedCategory !== "all" && item.categoryId !== selectedCategory) {
        return false;
      }

      const term = search.toLowerCase().trim();
      if (!term) return true;

      const hayCoincidencia =
        item.name.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term) ||
        (item.searchKeywords ?? []).some((k) =>
          k.toLowerCase().includes(term)
        );

      return hayCoincidencia;
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
        {/* buscador */}
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-headline font-bold">Menú</h1>
          <p className="text-muted-foreground">
            Descubrí nuestros platos, filtrá por categoría o buscá por
            ingrediente.
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
                          // si no hay imagen, mostramos un header neutro
                          <div className="h-16 w-full bg-muted flex items-center px-4 text-sm text-muted-foreground">
                            Sin imagen
                          </div>
                        )}

                        <CardHeader>
                          <CardTitle>{item.name}</CardTitle>
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

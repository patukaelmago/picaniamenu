'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, Pencil, Trash2, GripVertical, Loader2 } from 'lucide-react';
import { CATEGORIES, MENU_ITEMS } from '@/lib/data';
import type { Category, MenuItem } from '@/lib/types';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from '@/components/ui/sheet';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { generateSearchKeywords } from '@/ai/flows/generate-search-keywords';
import { useToast } from '@/hooks/use-toast';

const formatCurrency = (price: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(price);
};

export default function AdminMenuPage() {
  const [items, setItems] = useState<MenuItem[]>(MENU_ITEMS);
  const [categories, setCategories] = useState<Category[]>(CATEGORIES);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerateKeywords = async () => {
    setIsGenerating(true);
    try {
        const keywords = await generateSearchKeywords({
            name: "Bife de Chorizo",
            tags: ["carne", "parrilla"],
            category: "Parrilla",
        });
        toast({
            title: "Keywords generadas",
            description: `Se generaron las siguientes keywords: ${keywords.searchKeywords.join(', ')}`,
        });
    } catch(e) {
        console.error(e);
        toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudieron generar las keywords.",
        });
    } finally {
        setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Gestionar Menú</h1>
        <p className="text-muted-foreground">
          Agregá, editá y organizá las categorías y platos de tu restaurante.
        </p>
      </div>

      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items">Items del Menú</TabsTrigger>
          <TabsTrigger value="categories">Categorías</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Platos y Bebidas</CardTitle>
              <CardDescription>
                Administrá todos los items de tu menú.
              </CardDescription>
              <div className='flex justify-end'>
                <Sheet>
                    <SheetTrigger asChild>
                        <Button>
                          <PlusCircle className="mr-2 h-4 w-4" /> Agregar Item
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="sm:max-w-lg overflow-y-auto">
                        <SheetHeader>
                        <SheetTitle>Agregar Nuevo Item</SheetTitle>
                        <SheetDescription>
                            Completá los detalles del nuevo plato o bebida.
                        </SheetDescription>
                        </SheetHeader>
                        <div className="grid gap-4 py-4">
                            {/* Form fields here */}
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">Nombre</Label>
                                <Input id="name" className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="description" className="text-right">Descripción</Label>
                                <Textarea id="description" className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="price" className="text-right">Precio (ARS)</Label>
                                <Input id="price" type="number" className="col-span-3" />
                            </div>
                             <Button onClick={handleGenerateKeywords} disabled={isGenerating}>
                                {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Generar Keywords con IA
                            </Button>
                        </div>
                        <SheetFooter>
                        <SheetClose asChild>
                            <Button type="submit">Guardar Cambios</Button>
                        </SheetClose>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Imagen</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>En Stock</TableHead>
                    <TableHead>Visible</TableHead>
                    <TableHead>Especial</TableHead>
                    <TableHead className="w-[100px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map(item => {
                    const category = categories.find(c => c.id === item.categoryId);
                    const image = PlaceHolderImages.find(p => p.id === item.imageId);
                    return (
                        <TableRow key={item.id}>
                            <TableCell>
                                {image && <Image src={image.imageUrl} alt={item.name} width={50} height={50} className="rounded-md object-cover" data-ai-hint={image.imageHint} />}
                            </TableCell>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>{category?.name}</TableCell>
                            <TableCell>{formatCurrency(item.price)}</TableCell>
                            <TableCell><Switch checked={item.inStock} /></TableCell>
                            <TableCell><Switch checked={item.isVisible} /></TableCell>
                            <TableCell><Switch checked={item.isSpecial} /></TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Categorías del Menú</CardTitle>
              <CardDescription>
                Organizá las secciones de tu menú. Arrastrá para reordenar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {categories.sort((a,b) => a.order - b.order).map(category => (
                  <div key={category.id} className="flex items-center justify-between p-3 bg-secondary rounded-md">
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center space-x-2">
                        <Label htmlFor={`visible-${category.id}`} className="text-sm">Visible</Label>
                        <Switch id={`visible-${category.id}`} checked={category.isVisible} />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

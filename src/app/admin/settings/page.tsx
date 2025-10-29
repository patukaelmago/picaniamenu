'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Landmark, Wallet, Upload } from 'lucide-react';

export default function AdminSettingsPage() {

    const handlePublish = () => {
        // Here you would trigger an API call to update the 'publishedAt' timestamp in Firestore.
        toast({
            title: "¡Menú Publicado!",
            description: "Los cambios en tu menú ahora son visibles para los clientes.",
        });
    }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Ajustes del Restaurante</h1>
        <p className="text-muted-foreground">
          Configurá los detalles de tu restaurante y publicá tu menú.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Detalles del Restaurante</CardTitle>
            <CardDescription>
              Información básica que se mostrará a tus clientes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="restaurant-name">
                <Landmark className="inline-block mr-2 h-4 w-4" />
                Nombre del Restaurante
              </Label>
              <Input id="restaurant-name" defaultValue="Picaña" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">
                <Wallet className="inline-block mr-2 h-4 w-4" />
                Moneda
              </Label>
              <Input id="currency" defaultValue="ARS" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="logo">
                    <Upload className="inline-block mr-2 h-4 w-4" />
                    Logo del Restaurante
                </Label>
                <Input id="logo" type="file" />
            </div>
            <Button>Guardar Cambios</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Publicar Menú</CardTitle>
            <CardDescription>
              Hacé que los cambios en tu menú sean visibles para todos tus clientes con un solo click.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Al publicar, se actualizará la versión del menú que ven tus clientes. Esto no se puede deshacer.
            </p>
            <Button variant="default" size="lg" onClick={handlePublish}>
              Publicar Menú Ahora
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

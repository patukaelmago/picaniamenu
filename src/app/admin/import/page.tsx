import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Upload } from "lucide-react";

export default function AdminImportPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Importar Menú</h1>
        <p className="text-muted-foreground">
          Cargá tu menú desde una URL o un archivo CSV.
        </p>
      </div>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Herramienta de Importación</CardTitle>
          <CardDescription>
            Seleccioná un método para importar los datos de tu menú.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="url">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="url">
                <Download className="mr-2 h-4 w-4" />
                Importar desde URL
              </TabsTrigger>
              <TabsTrigger value="csv">
                <Upload className="mr-2 h-4 w-4" />
                Subir archivo CSV
              </TabsTrigger>
            </TabsList>
            <TabsContent value="url" className="mt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="json-url">URL del archivo JSON</Label>
                  <Input id="json-url" placeholder="https://example.com/menu.json" />
                </div>
                <Button>Obtener y Previsualizar</Button>
              </div>
            </TabsContent>
            <TabsContent value="csv" className="mt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="csv-file">Archivo CSV</Label>
                  <Input id="csv-file" type="file" accept=".csv" />
                </div>
                <Button>Subir y Previsualizar</Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

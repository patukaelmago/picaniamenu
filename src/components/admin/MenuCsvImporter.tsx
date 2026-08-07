"use client";

import { ChangeEvent, useRef, useState, type CSSProperties } from "react";
import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { Download, Loader2, Upload } from "lucide-react";

import { db } from "@/lib/firebase";
import { useTenantUI } from "@/hooks/use-tenant-ui";
import type { Category } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";

type CsvRow = {
  categoria: string;
  nombre: string;
  descripcion: string;
  precio: number;
  imagenUrl: string;
  visible: boolean;
  especial: boolean;
};

type Props = {
  tenantId: string;
  categories: Category[];
  currency: "ARS" | "USD";
  onImported: () => Promise<void>;
};

const TEMPLATE = [
  "categoria,nombre,descripcion,precio,imagenUrl,visible,especial",
  '"Entradas","Causa nikkei","Papa amarilla, atún y palta",18000,"https://ejemplo.com/causa.jpg",true,false',
  '"Principales","Costilla nikkei","Costilla glaseada con miso",32000,"",true,true',
].join("\n");

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function parseBoolean(value: string, fallback: boolean) {
  const normalized = normalize(value);
  if (["true", "si", "sí", "1", "visible"].includes(normalized)) return true;
  if (["false", "no", "0", "oculto"].includes(normalized)) return false;
  return fallback;
}

function parsePrice(value: string) {
  const clean = value.trim().replace(/\s/g, "");
  if (!clean) return 0;

  if (clean.includes(",") && clean.includes(".")) {
    return Number(clean.replace(/\./g, "").replace(",", ".")) || 0;
  }

  if (clean.includes(",")) {
    return Number(clean.replace(",", ".")) || 0;
  }

  return Number(clean) || 0;
}

function parseCsvLine(line: string, delimiter: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === delimiter && !quoted) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

function parseCsv(text: string): CsvRow[] {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim());

  if (lines.length < 2) {
    throw new Error("El archivo no contiene platos.");
  }

  const delimiter =
    (lines[0].match(/;/g)?.length ?? 0) > (lines[0].match(/,/g)?.length ?? 0)
      ? ";"
      : ",";

  const headers = parseCsvLine(lines[0], delimiter).map(normalize);
  const required = ["categoria", "nombre", "descripcion", "precio", "imagenurl", "visible", "especial"];

  for (const header of required) {
    if (!headers.includes(header)) {
      throw new Error(`Falta la columna "${header}".`);
    }
  }

  return lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line, delimiter);
    const data = new Map(headers.map((header, column) => [header, values[column] ?? ""]));

    const categoria = data.get("categoria")?.trim() ?? "";
    const nombre = data.get("nombre")?.trim() ?? "";

    if (!categoria || !nombre) {
      throw new Error(`Fila ${index + 2}: categoría y nombre son obligatorios.`);
    }

    return {
      categoria,
      nombre,
      descripcion: data.get("descripcion")?.trim() ?? "",
      precio: parsePrice(data.get("precio") ?? ""),
      imagenUrl: data.get("imagenurl")?.trim() ?? "",
      visible: parseBoolean(data.get("visible") ?? "", true),
      especial: parseBoolean(data.get("especial") ?? "", false),
    };
  });
}

export default function MenuCsvImporter({
  tenantId,
  categories,
  currency,
  onImported,
}: Props) {
  const { toast } = useToast();
  const ui = useTenantUI(tenantId);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);

  function downloadTemplate() {
    const blob = new Blob(["\uFEFF" + TEMPLATE], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "plantilla-carta-online.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const parsed = parseCsv(await file.text());
      setRows(parsed);
      setFileName(file.name);
    } catch (error) {
      setRows([]);
      setFileName("");
      toast({
        variant: "destructive",
        title: "CSV inválido",
        description:
          error instanceof Error ? error.message : "No se pudo leer el archivo.",
      });
    } finally {
      event.target.value = "";
    }
  }

  async function importRows() {
    if (rows.length === 0) return;
  
    try {
      setImporting(true);
  
      const catsCol = collection(db, "tenants", tenantId, "categories");
      const itemsCol = collection(db, "tenants", tenantId, "menuItems");
  
      const categoryIds = new Map(
        categories.map((category) => [normalize(category.name), category.id])
      );
  
      let nextCategoryOrder =
        categories.length === 0
          ? 0
          : Math.max(...categories.map((category) => category.order ?? 0)) + 1;
  
      for (const row of rows) {
        const key = normalize(row.categoria);
  
        if (!categoryIds.has(key)) {
          const categoryDoc = await addDoc(catsCol, {
            name: row.categoria,
            description: "",
            order: nextCategoryOrder,
            isVisible: true,
            parentCategoryId: null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
  
          categoryIds.set(key, categoryDoc.id);
          nextCategoryOrder += 1;
        }
      }
  
      const orderByCategory = new Map<string, number>();
  
      for (const row of rows) {
        const categoryId = categoryIds.get(normalize(row.categoria));
        if (!categoryId) continue;
  
        const order = orderByCategory.get(categoryId) ?? 0;
        orderByCategory.set(categoryId, order + 1);
  
        await addDoc(itemsCol, {
          name: row.nombre,
          description: row.descripcion,
          price: row.precio,
          currency,
          imageUrl: row.imagenUrl,
          imageId: "",
          categoryId,
          isVisible: row.visible,
          inStock: true,
          isSpecial: row.especial,
          tags: [],
          allergens: [],
          searchKeywords: [],
          order,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
  
      await onImported();
  
      toast({
        title: "Carta importada",
        description: `Se agregaron ${rows.length} ítems.`,
      });
  
      setRows([]);
      setFileName("");
      setOpen(false);
    } catch (error) {
      console.error(error);
  
      toast({
        variant: "destructive",
        title: "Error al importar",
        description: "No se pudo completar la importación.",
      });
    } finally {
      setImporting(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={downloadTemplate}
        className="border-[hsl(var(--csv-button-border))] bg-transparent text-[hsl(var(--csv-button-text))] hover:border-[hsl(var(--csv-button-hover-bg))] hover:bg-[hsl(var(--csv-button-hover-bg))] hover:text-[hsl(var(--csv-button-hover-text))]"
        style={{
          "--csv-button-border": `${ui.adminForeground} / 0.55`,
          "--csv-button-text": ui.adminForeground,
          "--csv-button-hover-bg": ui.adminAccent,
          "--csv-button-hover-text": ui.adminCard,
        } as CSSProperties}
      >
        <Download className="mr-2 h-4 w-4" />
        Plantilla CSV
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="border-[hsl(var(--csv-button-border))] bg-transparent text-[hsl(var(--csv-button-text))] hover:border-[hsl(var(--csv-button-hover-bg))] hover:bg-[hsl(var(--csv-button-hover-bg))] hover:text-[hsl(var(--csv-button-hover-text))]"
            style={{
              "--csv-button-border": `${ui.adminForeground} / 0.55`,
              "--csv-button-text": ui.adminForeground,
              "--csv-button-hover-bg": ui.adminAccent,
              "--csv-button-hover-text": ui.adminCard,
            } as CSSProperties}
          >
            <Upload className="mr-2 h-4 w-4" />
            Importar CSV
          </Button>
        </SheetTrigger>

        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>Importar carta desde CSV</SheetTitle>
            <SheetDescription>
              Las categorías inexistentes se crearán automáticamente.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-5 py-6">
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFile}
              className="hidden"
            />

            <Button
              type="button"
              variant="outline"
              onClick={() => inputRef.current?.click()}
            >
              Seleccionar archivo CSV
            </Button>

            {fileName && (
              <p className="text-sm text-muted-foreground">
                {fileName} · {rows.length} ítems encontrados
              </p>
            )}

            {rows.length > 0 && (
              <div className="max-h-[55vh] overflow-auto rounded-lg border">
                <table className="w-full min-w-[560px] text-sm">
                  <thead className="sticky top-0 bg-background">
                    <tr className="border-b text-left">
                      <th className="p-3">Categoría</th>
                      <th className="p-3">Nombre</th>
                      <th className="p-3">Precio</th>
                      <th className="p-3">Visible</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => (
                      <tr key={`${row.nombre}-${index}`} className="border-b">
                        <td className="p-3">{row.categoria}</td>
                        <td className="p-3">{row.nombre}</td>
                        <td className="p-3">
                          {new Intl.NumberFormat("es-AR").format(row.precio)}
                        </td>
                        <td className="p-3">{row.visible ? "Sí" : "No"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <Button
              type="button"
              onClick={importRows}
              disabled={rows.length === 0 || importing}
              className="w-full"
            >
              {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {importing ? "Importando..." : `Importar ${rows.length} ítems`}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

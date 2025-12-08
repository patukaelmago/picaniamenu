"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CATEGORIES, MENU_ITEMS } from "@/lib/data";
// Si no usás las tarjetas de resumen, podés borrar estos imports:
// import { Layers, Utensils, CalendarCheck } from "lucide-react";
// import { format } from "date-fns";
// import { es } from "date-fns/locale";

export default function AdminDashboardPage() {
  const totalCategories = CATEGORIES.length;
  const totalItems = MENU_ITEMS.length;
  const lastPublished = new Date(); // Mock data

  // ─────────────────────────────────────────────
  //   MENÚ VIERNES (buscamos la categoría)
  // ─────────────────────────────────────────────
  const fridayCategory =
    CATEGORIES.find(
      (c) =>
        c.name.toLowerCase() === "menú viernes" ||
        c.name.toLowerCase() === "menu viernes"
    ) ?? null;

  const fridayItems = fridayCategory
    ? MENU_ITEMS.filter((item) => item.categoryId === fridayCategory.id)
    : [];

  // Usamos un campo opcional "course" si existe en los items
  // (entrada | plato | postre). Si no existe, caen como "plato".
  const entradas = fridayItems
    .filter((item) => (item as any).course === "entrada")
    .sort((a, b) => a.name.localeCompare(b.name));

  const postres = fridayItems
    .filter((item) => (item as any).course === "postre")
    .sort((a, b) => a.name.localeCompare(b.name));

  const platos = fridayItems
    .filter((item) => {
      const course = (item as any).course;
      return !course || course === "plato";
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  // Por ahora los handlers sólo loguean. Después los conectamos a Firestore.
  const handleAddItem = (section: "entrada" | "plato" | "postre") => {
    console.log("Agregar item a sección:", section);
  };

  const handleEditItem = (id: string) => {
    console.log("Editar item Menú Viernes:", id);
  };

  const handleDeleteItem = (id: string) => {
    console.log("Eliminar item Menú Viernes:", id);
  };

  return (
    <div className="space-y-8">
      {/* CABECERA */}
      <div>
        <h1 className="text-3xl font-bold font-headline">Menú Viernes</h1>
        <p className="text-muted-foreground">
          La entrada, los platos y el postre del menú de los viernes.
        </p>
      </div>

      {/* TARJETAS RESUMEN (si querés usarlas, descomentá)
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        ...
      </div>
      */}

      {/* AVISO SI NO EXISTE LA CATEGORÍA */}
      {!fridayCategory && (
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-muted-foreground">
              No encontré la categoría <strong>“Menú Viernes”</strong>. Creala
              en la pestaña <strong>Menú</strong> y asignale los platos que
              quieras. Igual acá ya podés ir armando la estructura.
            </p>
          </CardContent>
        </Card>
      )}

      {/* MENÚ VIERNES – SIEMPRE MOSTRAMOS LAS SECCIONES */}
      <div className="mt-8 space-y-6">
        {/* ENTRADA */}
        <SectionCard
          title="La entrada"
          items={entradas}
          onAdd={() => handleAddItem("entrada")}
          onEdit={handleEditItem}
          onDelete={handleDeleteItem}
        />

        {/* PLATOS */}
        <SectionCard
          title="Platos del Menú Viernes"
          items={platos}
          onAdd={() => handleAddItem("plato")}
          onEdit={handleEditItem}
          onDelete={handleDeleteItem}
        />

        {/* POSTRE */}
        <SectionCard
          title="El postre"
          items={postres}
          onAdd={() => handleAddItem("postre")}
          onEdit={handleEditItem}
          onDelete={handleDeleteItem}
        />
      </div>
    </div>
  );
}

type SectionCardProps = {
  title: string;
  items: typeof MENU_ITEMS;
  onAdd: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

function SectionCard({
  title,
  items,
  onAdd,
  onEdit,
  onDelete,
}: SectionCardProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedPrice =
      price.trim() === "" ? null : Number(price.replace(",", "."));

    console.log("Nuevo item creado en sección:", title, {
      name,
      description,
      price: parsedPrice,
    });

    // Por ahora sólo llamamos al callback genérico.
    // Cuando tengas Firestore, acá va el create real.
    onAdd();

    // Reset
    setName("");
    setDescription("");
    setPrice("");
    setShowForm(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        <Button
          size="sm"
          onClick={() => {
            setShowForm((v) => !v);
          }}
        >
          {showForm ? "Cancelar" : "Agregar item"}
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* LISTA DE ITEMS EXISTENTES */}
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Todavía no hay items cargados para esta sección.
          </p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg border px-3 py-2"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium">{item.name}</span>
                {item.description && (
                  <span className="text-xs text-muted-foreground">
                    {item.description}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {item.price != null && (
                  <span className="text-sm font-semibold">
                    ${item.price.toLocaleString("es-AR")}
                  </span>
                )}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onEdit(item.id)}
                >
                  ✏️
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onDelete(item.id)}
                >
                  🗑
                </Button>
              </div>
            </div>
          ))
        )}

        {/* FORMULARIO PARA CREAR NUEVO ITEM */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="space-y-2 rounded-lg border border-dashed px-3 py-3"
          >
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium">Nombre del plato</label>
              <input
                className="h-8 rounded-md border px-2 text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Bife de chorizo"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium">Descripción</label>
              <textarea
                className="rounded-md border px-2 py-1 text-sm"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Opcional: breve descripción del plato"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium">Precio (opcional)</label>
              <input
                className="h-8 rounded-md border px-2 text-sm"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Ej: 28000"
                inputMode="numeric"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowForm(false);
                  setName("");
                  setDescription("");
                  setPrice("");
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" size="sm">
                Guardar item
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}


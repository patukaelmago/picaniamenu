import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CATEGORIES, MENU_ITEMS } from "@/lib/data";
import { Layers, Utensils, CalendarCheck } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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

  const handleAddItem = (section: "entrada" | "plato" | "postre") => {
    // Acá podés abrir el mismo modal que usás en la pestaña Menú,
    // con la categoría Menú Viernes y la sección preseleccionada.
    console.log("Agregar item a sección:", section);
  };

  const handleEditItem = (id: string) => {
    // Conectá esto a tu flujo de edición real
    console.log("Editar item Menú Viernes:", id);
  };

  const handleDeleteItem = (id: string) => {
    // Conectá esto a tu flujo de eliminación real
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

      {/* TARJETAS RESUMEN (las dejamos porque son útiles) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Categorías Totales
            </CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCategories}</div>
            <p className="text-xs text-muted-foreground">
              Categorías en el menú
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Totales</CardTitle>
            <Utensils className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">
              Platos y bebidas en el menú
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Última Publicación
            </CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {format(lastPublished, "dd MMM, yyyy", { locale: es })}
            </div>
            <p className="text-xs text-muted-foreground">
              {format(lastPublished, "HH:mm 'hs.'", { locale: es })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* MENÚ VIERNES */}
      <div className="mt-8 space-y-6">
        {!fridayCategory ? (
          <Card>
            <CardContent className="py-6">
              <p className="text-sm text-muted-foreground">
                No encontré la categoría <strong>“Menú Viernes”</strong>. Creala
                en la pestaña <strong>Menú</strong> y asignale los platos que
                quieras.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
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
          </>
        )}
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

function SectionCard({ title, items, onAdd, onEdit, onDelete }: SectionCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        <Button size="sm" onClick={onAdd}>
          Agregar item
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
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
      </CardContent>
    </Card>
  );
}

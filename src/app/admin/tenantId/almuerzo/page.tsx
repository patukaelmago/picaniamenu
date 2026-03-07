"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

type FridayDish = {
  id: string;
  name: string;
  description?: string;
  price?: number;
};

type FridayMenuData = {
  entrada: string;
  postre: string;
  platos: FridayDish[];
};

export default function AdminDashboardPage() {
  const [menu, setMenu] = useState<FridayMenuData | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ estados de guardado separados (no se hunden ambos botones)
  const [savingEntrada, setSavingEntrada] = useState(false);
  const [savingPostre, setSavingPostre] = useState(false);
  const [savingPlatos, setSavingPlatos] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // drafts para los inputs de entrada y postre
  const [entradaDraft, setEntradaDraft] = useState("");
  const [postreDraft, setPostreDraft] = useState("");

  // ─────────────────────────────────────────────
  //   Cargar Menú Viernes desde Firestore
  // ─────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const ref = doc(db, "menu_viernes", "data");
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data() as Partial<FridayMenuData>;
          const safeData: FridayMenuData = {
            entrada: data.entrada ?? "",
            postre: data.postre ?? "",
            platos: Array.isArray(data.platos) ? (data.platos as FridayDish[]) : [],
          };
          setMenu(safeData);
          setEntradaDraft(safeData.entrada);
          setPostreDraft(safeData.postre);
        } else {
          const emptyMenu: FridayMenuData = { entrada: "", postre: "", platos: [] };
          setMenu(emptyMenu);
          setEntradaDraft("");
          setPostreDraft("");
        }
      } catch (err) {
        console.error("Error cargando menú viernes:", err);
        setError("No se pudo cargar el Menú Viernes.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // guarda el menú completo (o un parcial) en Firestore
  const saveMenu = async (partial: Partial<FridayMenuData>) => {
    if (!menu) return;

    setError(null);

    try {
      const ref = doc(db, "menu_viernes", "data");
      const nextMenu: FridayMenuData = {
        entrada: menu.entrada,
        postre: menu.postre,
        platos: menu.platos,
        ...partial,
      };

      // ✅ Guardamos SOLO lo que viene en partial (merge true),
      // y actualizamos el state con la versión combinada.
      await setDoc(ref, partial, { merge: true });
      setMenu(nextMenu);
    } catch (err) {
      console.error("Error guardando Menú Viernes:", err);
      setError("No se pudo guardar el Menú Viernes.");
      throw err;
    }
  };

  // ─────────────────────────────────────────────
  //   Handlers de Entrada / Postre
  // ─────────────────────────────────────────────
  const handleSaveEntrada = async () => {
    if (!menu) return;
    setSavingEntrada(true);
    try {
      await saveMenu({ entrada: entradaDraft });
    } finally {
      setSavingEntrada(false);
    }
  };

  const handleSavePostre = async () => {
    if (!menu) return;
    setSavingPostre(true);
    try {
      await saveMenu({ postre: postreDraft });
    } finally {
      setSavingPostre(false);
    }
  };

  // ─────────────────────────────────────────────
  //   Handlers de Platos
  // ─────────────────────────────────────────────
  const handleSavePlatos = async (platos: FridayDish[]) => {
    setSavingPlatos(true);
    try {
      await saveMenu({ platos });
    } finally {
      setSavingPlatos(false);
    }
  };

  if (loading || !menu) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold font-headline">Menú Viernes</h1>
        <p className="mt-2 text-muted-foreground">Cargando menú…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* CABECERA */}
      <div>
        <h1 className="text-3xl font-bold font-headline">Menú Viernes</h1>
        <p className="text-muted-foreground">
          La entrada, los platos y el postre del menú de los viernes.
        </p>
      </div>

      {error && (
        <Card>
          <CardContent className="py-3">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* ENTRADA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">La entrada</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Acá cargás el texto de la entrada que se ve en la carta (por ej.:
            “Focaccia, humus de zanahoria, bocconcinos…”).
          </p>

          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Texto de la entrada del viernes"
            value={entradaDraft}
            onChange={(e) => setEntradaDraft(e.target.value)}
          />

          <div className="flex justify-end">
            <Button size="sm" onClick={handleSaveEntrada} disabled={savingEntrada}>
              {savingEntrada ? "Guardando…" : "Guardar entrada"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* PLATOS
      <PlatosSection platos={menu.platos} onChange={handleSavePlatos} saving={savingPlatos} />
         */}
      {/* POSTRE */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">El postre</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Acá cargás el texto del postre del menú viernes (por ej.: “Crumble
            de pera con helado…”).
          </p>

          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Texto del postre del viernes"
            value={postreDraft}
            onChange={(e) => setPostreDraft(e.target.value)}
          />

          <div className="flex justify-end">
            <Button size="sm" onClick={handleSavePostre} disabled={savingPostre}>
              {savingPostre ? "Guardando…" : "Guardar postre"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────
//   Sección PLATOS (múltiples items)
// ─────────────────────────────────────────────

type PlatosSectionProps = {
  platos: FridayDish[];
  onChange: (platos: FridayDish[]) => Promise<void> | void;
  saving: boolean;
};

function PlatosSection({ platos, onChange, saving }: PlatosSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setPrice("");
  };

  const startCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const startEdit = (dish: FridayDish) => {
    setEditingId(dish.id);
    setName(dish.name);
    setDescription(dish.description ?? "");
    setPrice(dish.price != null ? String(dish.price) : "");
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const next = platos.filter((p) => p.id !== id);
    await onChange(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedPrice = price.trim() === "" ? undefined : Number(price.replace(",", "."));

    const base: FridayDish = {
      id:
        editingId ??
        (typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : String(Date.now())),
      name: name.trim(),
      description: description.trim() || undefined,
      price: parsedPrice != null && !Number.isNaN(parsedPrice) ? parsedPrice : undefined,
    };

    let next: FridayDish[];
    if (editingId) {
      next = platos.map((p) => (p.id === editingId ? base : p));
    } else {
      next = [...platos, base];
    }

    await onChange(next);
    resetForm();
    setShowForm(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold">Platos del Menú Viernes</CardTitle>
        <Button size="sm" onClick={startCreate}>
          Agregar item
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* LISTA DE PLATOS */}
        {platos.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Todavía no hay platos cargados para el menú viernes.
          </p>
        ) : (
          platos.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg border px-3 py-2"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium">{item.name}</span>
                {item.description && (
                  <span className="text-xs text-muted-foreground">{item.description}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {item.price != null && (
                  <span className="text-sm font-semibold">
                    ${item.price.toLocaleString("es-AR")}
                  </span>
                )}
                <Button variant="outline" size="icon" onClick={() => startEdit(item)}>
                  ✏️
                </Button>
                <Button variant="outline" size="icon" onClick={() => handleDelete(item.id)}>
                  🗑
                </Button>
              </div>
            </div>
          ))
        )}

        {/* FORMULARIO */}
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
                placeholder="Ej: Milanesas con crema de batatas"
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
                placeholder="Ej: 18500"
                inputMode="numeric"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? "Guardando…" : editingId ? "Actualizar plato" : "Guardar plato"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

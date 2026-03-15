
"use client";

import { use, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";
import { redirect } from "next/navigation";

type FridayMenuData = {
  entrada: string;
  postre: string;
};

export default function TenantAlmuerzoPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = use(params);
  const [data, setData] = useState<FridayMenuData>({ entrada: "", postre: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Solo Picaña tiene esta sección por ahora
  if (tenantId !== "picana") {
    redirect(`/admin/${tenantId}/menu`);
  }

  useEffect(() => {
    const load = async () => {
      try {
        const ref = doc(db, "tenants", tenantId, "special_menus", "friday");
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setData(snap.data() as FridayMenuData);
        } else {
          // Fallback legacy para picana
          const legacyRef = doc(db, "menu_viernes", "data");
          const legacySnap = await getDoc(legacyRef);
          if (legacySnap.exists()) {
            setData({
              entrada: legacySnap.data().entrada ?? "",
              postre: legacySnap.data().postre ?? "",
            });
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tenantId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const ref = doc(db, "tenants", tenantId, "special_menus", "friday");
      await setDoc(ref, data, { merge: true });
      toast({ title: "Menú guardado", description: "El menú de almuerzo se actualizó correctamente." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo guardar el menú." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-8 text-center text-muted-foreground animate-pulse">Cargando configuración...</p>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Configuración de Almuerzo</h1>
        <p className="text-muted-foreground">Menú especial de los viernes para {tenantId}</p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Menú del Viernes</CardTitle>
            <CardDescription>Definí la entrada y el postre para este cliente.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Entrada del Día</Label>
              <Input 
                value={data.entrada} 
                onChange={(e) => setData({ ...data, entrada: e.target.value })}
                placeholder="Ej: Focaccia con hummus..."
              />
            </div>
            <div className="space-y-2">
              <Label>Postre o Café</Label>
              <Input 
                value={data.postre} 
                onChange={(e) => setData({ ...data, postre: e.target.value })}
                placeholder="Ej: Flan casero..."
              />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? "Guardando..." : "Guardar Menú"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

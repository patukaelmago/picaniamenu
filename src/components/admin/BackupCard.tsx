"use client";

import { useRef, useState } from "react";
import { collection, doc, getDocs, writeBatch, type DocumentData } from "firebase/firestore";
import { Download, Upload } from "lucide-react";
import { db } from "@/lib/firebase";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Copia de la carta: categorías y platos del local.
type Backup = {
  tipo: "carta-online-copia";
  version: 1;
  local: string;
  fecha: string;
  categorias: { id: string; data: DocumentData }[];
  platos: { id: string; data: DocumentData }[];
};

const BATCH_LIMIT = 400;

async function readCarta(tenantId: string): Promise<Backup> {
  const [cats, items] = await Promise.all([
    getDocs(collection(db, "tenants", tenantId, "categories")),
    getDocs(collection(db, "tenants", tenantId, "menuItems")),
  ]);
  return {
    tipo: "carta-online-copia",
    version: 1,
    local: tenantId,
    fecha: new Date().toISOString(),
    categorias: cats.docs.map((d) => ({ id: d.id, data: d.data() })),
    platos: items.docs.map((d) => ({ id: d.id, data: d.data() })),
  };
}

function downloadJson(backup: Backup) {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const day = backup.fecha.slice(0, 10);
  a.href = url;
  a.download = `carta-${backup.local}-${day}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Las fechas de Firestore se guardan como {seconds, nanoseconds}; se dejan afuera al restaurar.
function cleanData(data: DocumentData) {
  const { createdAt: _c, updatedAt: _u, ...rest } = data ?? {};
  return rest;
}

// Se prueba cargando la imagen (no depende de permisos CORS). Ante la duda, se conserva.
function photoExists(url: string) {
  return new Promise<boolean>((resolve) => {
    const img = new Image();
    const timer = window.setTimeout(() => resolve(true), 15000);
    img.onload = () => {
      window.clearTimeout(timer);
      resolve(true);
    };
    img.onerror = () => {
      window.clearTimeout(timer);
      resolve(false);
    };
    img.src = url;
  });
}

function parseBackup(text: string, tenantId: string): Backup {
  const data = JSON.parse(text);
  if (data?.tipo !== "carta-online-copia" || !Array.isArray(data.categorias) || !Array.isArray(data.platos)) {
    throw new Error("El archivo no es una copia de Carta Online.");
  }
  if (data.local !== tenantId) {
    throw new Error(`Esta copia es de otro local (${data.local}).`);
  }
  return data as Backup;
}

export default function BackupCard({ tenantId }: { tenantId: string }) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState<"" | "download" | "restore">("");
  const [pending, setPending] = useState<Backup | null>(null);

  async function handleDownload() {
    setBusy("download");
    try {
      downloadJson(await readCarta(tenantId));
      toast({ title: "Copia descargada" });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "No se pudo descargar la copia" });
    } finally {
      setBusy("");
    }
  }

  async function handleFile(file: File | null) {
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    try {
      setPending(parseBackup(await file.text(), tenantId));
    } catch (e) {
      toast({
        variant: "destructive",
        title: "No se puede usar ese archivo",
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  async function handleRestore() {
    const backup = pending;
    setPending(null);
    if (!backup) return;
    setBusy("restore");
    try {
      // Antes de reemplazar, se descarga la carta actual por si hay que volver atrás.
      const current = await readCarta(tenantId);
      downloadJson(current);

      // Fotos que ya no existen quedan sin foto en vez de rotas.
      const urls = Array.from(
        new Set(backup.platos.map((p) => String(p.data?.imageUrl ?? "")).filter(Boolean))
      );
      const alive = new Map<string, boolean>();
      await Promise.all(urls.map(async (u) => alive.set(u, await photoExists(u))));

      const ops: Array<(b: ReturnType<typeof writeBatch>) => void> = [];
      const keepCats = new Set(backup.categorias.map((c) => c.id));
      const keepItems = new Set(backup.platos.map((p) => p.id));

      current.categorias
        .filter((c) => !keepCats.has(c.id))
        .forEach((c) => ops.push((b) => b.delete(doc(db, "tenants", tenantId, "categories", c.id))));
      current.platos
        .filter((p) => !keepItems.has(p.id))
        .forEach((p) => ops.push((b) => b.delete(doc(db, "tenants", tenantId, "menuItems", p.id))));

      backup.categorias.forEach((c) =>
        ops.push((b) => b.set(doc(db, "tenants", tenantId, "categories", c.id), cleanData(c.data)))
      );
      backup.platos.forEach((p) => {
        const data = cleanData(p.data);
        const url = String(data.imageUrl ?? "");
        if (url && alive.get(url) === false) data.imageUrl = "";
        ops.push((b) => b.set(doc(db, "tenants", tenantId, "menuItems", p.id), data));
      });

      for (let i = 0; i < ops.length; i += BATCH_LIMIT) {
        const batch = writeBatch(db);
        ops.slice(i, i + BATCH_LIMIT).forEach((op) => op(batch));
        await batch.commit();
      }

      const lostPhotos = Array.from(alive.values()).filter((ok) => !ok).length;
      toast({
        title: "Carta restaurada",
        description:
          lostPhotos > 0
            ? `${lostPhotos} foto(s) ya no existían y esos platos quedaron sin foto.`
            : undefined,
      });
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "No se pudo restaurar la copia",
        description: "Se descargó una copia de la carta actual por si la necesitás.",
      });
    } finally {
      setBusy("");
    }
  }

  const fecha = pending
    ? new Date(pending.fecha).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })
    : "";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Copia de seguridad</CardTitle>
        <CardDescription>
          Descargá una copia de tu carta (categorías y platos) y guardala. Si algo se borra por
          error, la podés restaurar desde ese archivo.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row">
        <Button type="button" onClick={handleDownload} disabled={busy !== ""}>
          <Download className="mr-2 h-4 w-4" />
          {busy === "download" ? "Descargando..." : "Descargar copia"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => fileRef.current?.click()}
          disabled={busy !== ""}
        >
          <Upload className="mr-2 h-4 w-4" />
          {busy === "restore" ? "Restaurando..." : "Restaurar desde una copia"}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
      </CardContent>

      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Restaurar la copia del {fecha}?</AlertDialogTitle>
            <AlertDialogDescription>
              Tu carta actual se reemplaza por la de la copia: {pending?.categorias.length ?? 0}{" "}
              categorías y {pending?.platos.length ?? 0} platos. Antes de hacerlo se descarga una
              copia de la carta actual, por si querés volver atrás.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button variant="destructive" onClick={handleRestore}>
              Restaurar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

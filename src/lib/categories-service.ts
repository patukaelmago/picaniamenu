"use client";

import { db } from "./firebase";
import type { Category } from "./types";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot,
  where,
} from "firebase/firestore";

// Nombre de la colección en Firestore
const categoriesCollection = collection(db, "categorias");

// =========================
// Lectura one-shot (lista)
// =========================
export async function listCategories(): Promise<Category[]> {
  const q = query(categoriesCollection, orderBy("order", "asc"));
  const snap = await getDocs(q);

  return snap.docs.map((d) => {
    const data = d.data() as any;
    return {
      id: d.id,
      name: data.name,
      order: typeof data.order === "number" ? data.order : Number(data.order) || 0,
      isVisible: data.isVisible ?? true,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
    } as Category;
  });
}

// =========================
// Crear / Actualizar / Borrar
// =========================
export async function createCategory(
  input: Pick<Category, "name" | "order" | "isVisible">
): Promise<string> {
  const now = serverTimestamp();
  const docRef = await addDoc(categoriesCollection, {
    name: input.name,
    order: input.order ?? 0,
    isVisible: input.isVisible ?? true,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function updateCategory(
  id: string,
  input: Partial<Pick<Category, "name" | "order" | "isVisible">>
): Promise<void> {
  const ref = doc(db, "categorias", id);
  await updateDoc(ref, {
    ...input,
    // normalizo por si viene string
    ...(input.order !== undefined
      ? { order: typeof input.order === "number" ? input.order : Number(input.order) || 0 }
      : {}),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCategory(id: string): Promise<void> {
  const ref = doc(db, "categorias", id);
  await deleteDoc(ref);
}

// =========================
// 🔊 Listener en tiempo real
// =========================
export function listenCategories(
  cb: (cats: Category[]) => void,
  opts?: { onlyVisible?: boolean }
) {
  let qRef = query(categoriesCollection, orderBy("order", "asc"));
  if (opts?.onlyVisible) {
    // si querés sólo visibles
    qRef = query(categoriesCollection, where("isVisible", "==", true), orderBy("order", "asc"));
  }

  const unsubscribe = onSnapshot(qRef, (snap) => {
    const list = snap.docs.map((d) => {
      const data = d.data() as any;
      return {
        id: d.id,
        name: data.name,
        order: typeof data.order === "number" ? data.order : Number(data.order) || 0,
        isVisible: data.isVisible ?? true,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
      } as Category;
    });
    cb(list);
  });

  return unsubscribe; // llamalo en el cleanup del useEffect
}

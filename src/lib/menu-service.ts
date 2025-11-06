"use client";

import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import type { MenuItem, MenuItemInput } from "./types";

// Colección de Firestore
const menuCollection = collection(db, "menuItems");

// =========================
// Leer una vez (lista)
// =========================
export async function listMenuItems(): Promise<MenuItem[]> {
  const q = query(menuCollection, orderBy("order", "asc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((d) => {
    const data = d.data() as any;
    return {
      id: d.id,
      name: data.name,
      description: data.description,
      price: data.price,
      currency: data.currency,
      imageUrl: data.imageUrl,
      imageId: data.imageId,
      categoryId: data.categoryId,
      isVisible: data.isVisible,
      inStock: data.inStock,
      isSpecial: data.isSpecial,
      tags: data.tags ?? [],
      allergens: data.allergens ?? [],
      searchKeywords: data.searchKeywords ?? [],
      order: data.order ?? 0,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
    } as MenuItem;
  });
}

// =========================
// CRUD
// =========================
export async function createMenuItem(input: MenuItemInput): Promise<string> {
  const now = serverTimestamp();
  const docRef = await addDoc(menuCollection, {
    ...input,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function updateMenuItem(
  id: string,
  input: Partial<MenuItemInput>
): Promise<void> {
  const ref = doc(db, "menuItems", id);
  await updateDoc(ref, {
    ...input,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteMenuItem(id: string): Promise<void> {
  const ref = doc(db, "menuItems", id);
  await deleteDoc(ref);
}

// =========================
// 🔊 Escucha en tiempo real
// =========================
export function listenMenuItems(
  cb: (items: MenuItem[]) => void,
  opts?: { onlyVisible?: boolean; onlyInStock?: boolean }
) {
  let qRef = query(menuCollection, orderBy("order", "asc"));

  const filters: any[] = [];
  if (opts?.onlyVisible) filters.push(where("isVisible", "==", true));
  if (opts?.onlyInStock) filters.push(where("inStock", "==", true));

  if (filters.length) {
    // @ts-ignore — se permite spread con filtros
    qRef = query(menuCollection, ...filters, orderBy("order", "asc"));
  }

  const unsub = onSnapshot(qRef, (snap) => {
    const list = snap.docs.map((d) => {
      const data = d.data() as any;
      return {
        id: d.id,
        name: data.name,
        description: data.description,
        price: data.price,
        currency: data.currency,
        imageUrl: data.imageUrl,
        imageId: data.imageId,
        categoryId: data.categoryId,
        isVisible: data.isVisible,
        inStock: data.inStock,
        isSpecial: data.isSpecial,
        tags: data.tags ?? [],
        allergens: data.allergens ?? [],
        searchKeywords: data.searchKeywords ?? [],
        order: data.order ?? 0,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
      } as MenuItem;
    });

    cb(list);
  });

  return unsub;
}

// src/lib/menu-service.ts
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
} from "firebase/firestore";
import { db } from "./firebase";
import type { MenuItem, MenuItemInput } from "./types";

const menuCollection = collection(db, "menuItems");

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
      createdAt: data.createdAt?.toDate
        ? data.createdAt.toDate()
        : new Date(),
      updatedAt: data.updatedAt?.toDate
        ? data.updatedAt.toDate()
        : new Date(),
    } as MenuItem;
  });
}

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

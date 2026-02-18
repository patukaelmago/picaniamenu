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
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "./firebase";
import type { MenuItem, MenuItemInput } from "./types";

// ✅ tenants/{tenantId}/menuItems
function menuCollection(tenantId: string) {
  if (!tenantId) throw new Error("menu-service: tenantId requerido");
  return collection(db, "tenants", tenantId, "menuItems");
}

// =========================
// Leer una vez (lista)
// =========================
export async function listMenuItems(tenantId: string): Promise<MenuItem[]> {
  const q = query(menuCollection(tenantId), orderBy("order", "asc"));
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
export async function createMenuItem(
  tenantId: string,
  input: MenuItemInput
): Promise<string> {
  const now = serverTimestamp();
  const docRef = await addDoc(menuCollection(tenantId), {
    ...input,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function updateMenuItem(
  tenantId: string,
  id: string,
  input: Partial<MenuItemInput>
): Promise<void> {
  const ref = doc(db, "tenants", tenantId, "menuItems", id);
  await updateDoc(ref, {
    ...input,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteMenuItem(tenantId: string, id: string): Promise<void> {
  const ref = doc(db, "tenants", tenantId, "menuItems", id);
  await deleteDoc(ref);
}

// =========================
// 🔊 Escucha en tiempo real
// =========================
export function listenMenuItems(
  tenantId: string,
  cb: (items: MenuItem[]) => void,
  opts?: { onlyVisible?: boolean; onlyInStock?: boolean }
) {
  const constraints: QueryConstraint[] = [];

  if (opts?.onlyVisible) constraints.push(where("isVisible", "==", true));
  if (opts?.onlyInStock) constraints.push(where("inStock", "==", true));

  constraints.push(orderBy("order", "asc"));

  const qRef = query(menuCollection(tenantId), ...constraints);

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

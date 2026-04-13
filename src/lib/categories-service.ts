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
  type QueryConstraint,
} from "firebase/firestore";

// ✅ Referencia única a la subcolección del tenant
function categoriesCollectionRef(tenantId: string) {
  if (!tenantId) throw new Error("categories-service: tenantId requerido");
  return collection(db, "tenants", tenantId, "categories");
}

function mapCategory(d: any): Category {
  const data = d.data() as any;
  return {
    id: d.id,
    name: data.name,
    order: typeof data.order === "number" ? data.order : Number(data.order) || 0,
    isVisible: data.isVisible ?? true,
    parentCategoryId: data.parentCategoryId ?? null,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
  } as Category;
}

// =========================
// Leer una vez (lista)
// =========================
export async function listCategories(tenantId: string): Promise<Category[]> {
  const col = categoriesCollectionRef(tenantId);
  const qRef = query(col, orderBy("order", "asc"));
  const snap = await getDocs(qRef);
  return snap.docs.map(mapCategory);
}

// =========================
// CRUD (Siempre en tenant)
// =========================
export async function createCategory(
  tenantId: string,
  input: Pick<Category, "name" | "order" | "isVisible" | "parentCategoryId">
): Promise<string> {
  const col = categoriesCollectionRef(tenantId);
  const now = serverTimestamp();
  const docRef = await addDoc(col, {
    name: input.name,
    order: input.order ?? 0,
    isVisible: input.isVisible ?? true,
    parentCategoryId: input.parentCategoryId ?? null,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function updateCategory(
  tenantId: string,
  id: string,
  input: Partial<Pick<Category, "name" | "order" | "isVisible" | "parentCategoryId">>
): Promise<void> {
  const ref = doc(db, "tenants", tenantId, "categories", id);
  await updateDoc(ref, {
    ...input,
    ...(input.order !== undefined ? { order: Number(input.order) || 0 } : {}),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCategory(tenantId: string, id: string): Promise<void> {
  const ref = doc(db, "tenants", tenantId, "categories", id);
  await deleteDoc(ref);
}

// =========================
// Escucha en tiempo real
// =========================
export function listenCategories(
  tenantId: string,
  cb: (cats: Category[]) => void,
  opts?: { onlyVisible?: boolean }
) {
  const constraints: QueryConstraint[] = [];
  if (opts?.onlyVisible) constraints.push(where("isVisible", "==", true));
  constraints.push(orderBy("order", "asc"));

  const q = query(categoriesCollectionRef(tenantId), ...constraints);
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map(mapCategory));
  });
}
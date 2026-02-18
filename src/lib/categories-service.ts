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

// ✅ NUEVO: referencia a la subcolección del tenant
function categoriesCollectionRef(tenantId: string) {
  return collection(db, "tenants", tenantId, "categories");
}

// ✅ NUEVO: referencia legacy (lo viejo que ya tenías cargado)
function legacyCategoriesCollectionRef() {
  return collection(db, "categories");
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
// Lectura one-shot (lista)
// =========================
export async function listCategories(tenantId: string): Promise<Category[]> {
  // 1) intento multi-tenant
  {
    const col = categoriesCollectionRef(tenantId);
    const qRef = query(col, orderBy("order", "asc"));
    const snap = await getDocs(qRef);
    if (!snap.empty) return snap.docs.map(mapCategory);
  }

  // 2) fallback legacy (si el tenant aún no tiene nada)
  {
    const col = legacyCategoriesCollectionRef();
    const qRef = query(col, orderBy("order", "asc"));
    const snap = await getDocs(qRef);
    return snap.docs.map(mapCategory);
  }
}

// =========================
// Crear (siempre en tenant)
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

// =========================
// Actualizar (tenant)
// =========================
export async function updateCategory(
  tenantId: string,
  id: string,
  input: Partial<
    Pick<Category, "name" | "order" | "isVisible" | "parentCategoryId">
  >
): Promise<void> {
  const ref = doc(db, "tenants", tenantId, "categories", id);

  await updateDoc(ref, {
    ...input,
    ...(input.order !== undefined
      ? {
          order:
            typeof input.order === "number"
              ? input.order
              : Number(input.order) || 0,
        }
      : {}),
    updatedAt: serverTimestamp(),
  });
}

// =========================
// Eliminar (tenant)
// =========================
export async function deleteCategory(
  tenantId: string,
  id: string
): Promise<void> {
  const ref = doc(db, "tenants", tenantId, "categories", id);
  await deleteDoc(ref);
}

// =========================
// 🔊 Listener en tiempo real
// =========================
export function listenCategories(
  tenantId: string,
  cb: (cats: Category[]) => void,
  opts?: { onlyVisible?: boolean }
) {
  const constraints: QueryConstraint[] = [];

  if (opts?.onlyVisible) constraints.push(where("isVisible", "==", true));
  constraints.push(orderBy("order", "asc"));

  // 1) escucho tenant; si viene vacío, engancho legacy
  const tenantCol = categoriesCollectionRef(tenantId);
  const tenantQuery = query(tenantCol, ...constraints);

  let legacyUnsub: (() => void) | null = null;

  const tenantUnsub = onSnapshot(tenantQuery, (snap) => {
    if (!snap.empty) {
      // si tenant tiene data, corto legacy si estaba activo
      if (legacyUnsub) {
        legacyUnsub();
        legacyUnsub = null;
      }
      cb(snap.docs.map(mapCategory));
      return;
    }

    // si tenant está vacío, escucho legacy (una sola vez)
    if (!legacyUnsub) {
      const legacyCol = legacyCategoriesCollectionRef();
      const legacyQuery = query(legacyCol, ...constraints);

      legacyUnsub = onSnapshot(legacyQuery, (legacySnap) => {
        cb(legacySnap.docs.map(mapCategory));
      });
    }
  });

  return () => {
    tenantUnsub();
    if (legacyUnsub) legacyUnsub();
  };
}

import { db } from "./firebase";
import { maidoDemo } from "@/demo-data/maido";

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  writeBatch,
} from "firebase/firestore";

export async function restoreMaidoDemo() {
  const tenantId = "maido";

  // Borrar categorías
  const categoriesSnap = await getDocs(
    collection(db, `tenants/${tenantId}/categories`)
  );

  for (const category of categoriesSnap.docs) {
    await deleteDoc(category.ref);
  }

  // Borrar items
  const itemsSnap = await getDocs(
    collection(db, `tenants/${tenantId}/menuItems`)
  );

  for (const item of itemsSnap.docs) {
    await deleteDoc(item.ref);
  }

  // Restaurar restaurant
  await setDoc(
    doc(db, `tenants/${tenantId}/settings/restaurant`),
    maidoDemo.restaurant
  );

  // Restaurar UI
  await setDoc(
    doc(db, `tenants/${tenantId}/settings/ui`),
    maidoDemo.ui
  );

  // Restaurar categorías
  for (const category of maidoDemo.categories) {
    const { id, ...data } = category;

    await setDoc(
      doc(db, `tenants/${tenantId}/categories/${id}`),
      data
    );
  }

  // Restaurar items
  for (const item of maidoDemo.menuItems) {
    const { id, ...data } = item;

    await setDoc(
      doc(db, `tenants/${tenantId}/menuItems/${id}`),
      data
    );
  }

  console.log("✅ Demo Maido restaurado.");
}
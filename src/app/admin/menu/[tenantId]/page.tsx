"use client";

import { useEffect, useState, use } from "react";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AdminMenuTenantPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = use(params);

  const [categories, setCategories] = useState<any[]>([]);

  const loadCategories = async () => {
    const ref = collection(db, "tenants", tenantId, "categories");
    const snap = await getDocs(ref);
    setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const createCategory = async () => {
    await addDoc(collection(db, "tenants", tenantId, "categories"), {
      name: "Nueva categoría",
      order: 0,
      active: true,
    });
    loadCategories();
  };

  useEffect(() => {
    loadCategories();
  }, [tenantId]);

  return (
    <div style={{ padding: 40 }}>
      <h1>Admin menú – {tenantId}</h1>

      <button onClick={createCategory} style={{ marginBottom: 20 }}>
        + Crear categoría
      </button>

      <pre>{JSON.stringify(categories, null, 2)}</pre>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useParams } from "next/navigation";

export type RestaurantSettings = {
  name?: string;
  currency?: string;
  logoUrl?: string;
};

export function useRestaurantSettings() {
  const [data, setData] = useState<RestaurantSettings | null>(null);
  const params = useParams();
  const tenantId = params?.tenantId as string;

  useEffect(() => {
    if (!tenantId) return;

    const ref = doc(db, "tenants", tenantId, "settings", "restaurant");

    const unsub = onSnapshot(ref, (snap) => {
      setData((snap.data() as RestaurantSettings) ?? null);
    });

    return () => unsub();
  }, [tenantId]);

  return data;
}
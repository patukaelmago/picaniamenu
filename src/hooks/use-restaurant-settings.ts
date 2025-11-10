"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

export type RestaurantSettings = {
  name?: string;
  currency?: string;
  logoUrl?: string;
};

export function useRestaurantSettings() {
  const [data, setData] = useState<RestaurantSettings | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "restaurant"), (snap) => {
      setData((snap.data() as RestaurantSettings) ?? null);
    });
    return () => unsub();
  }, []);

  return data;
}

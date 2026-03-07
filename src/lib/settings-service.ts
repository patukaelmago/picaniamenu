// src/lib/settings-service.ts
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export type RestaurantSettings = {
  name: string;
  currency: string;
  logoUrl: string;
};

function getSettingsDocRef(tenantId: string) {
  return doc(db, "tenants", tenantId, "settings", "restaurant");
}

export async function getRestaurantSettings(
  tenantId: string
): Promise<RestaurantSettings> {
  const snap = await getDoc(getSettingsDocRef(tenantId));

  if (!snap.exists()) {
    return {
      name: tenantId,
      currency: "ARS",
      logoUrl: "",
    };
  }

  const data = snap.data() as any;

  return {
    name: data.name ?? tenantId,
    currency: data.currency ?? "ARS",
    logoUrl: data.logoUrl ?? "",
  };
}

export async function saveRestaurantSettings(
  tenantId: string,
  data: RestaurantSettings
): Promise<void> {
  await setDoc(
    getSettingsDocRef(tenantId),
    {
      name: data.name,
      currency: data.currency,
      logoUrl: data.logoUrl,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
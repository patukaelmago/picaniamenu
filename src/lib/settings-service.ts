// src/lib/settings-service.ts
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export type RestaurantSettings = {
  name: string;
  currency: string;
  logoUrl: string;
  showLogo: boolean;
  showName: boolean;
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
      showLogo: true,
      showName: true,
    };
  }

  const data = snap.data() as any;

  return {
    name: data.name ?? tenantId,
    currency: data.currency ?? "ARS",
    logoUrl: data.logoUrl ?? "",
    showLogo: data.showLogo ?? true,
    showName: data.showName ?? true,
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
      showLogo: data.showLogo,
      showName: data.showName,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
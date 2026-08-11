// src/lib/settings-service.ts
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export type RestaurantSettings = {
  name: string;
  currency: string;
  logoUrl: string;
  websiteUrl: string;
  showLogo: boolean;
  showName: boolean;
  specialLabel: string;
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
      websiteUrl: "",
      showLogo: true,
      showName: true,
      specialLabel: "Sugerencia",
    };
  }

  const data = snap.data() as any;

  return {
    name: data.name ?? tenantId,
    currency: data.currency ?? "ARS",
    logoUrl: data.logoUrl ?? "",
    websiteUrl: data.websiteUrl ?? "",
    showLogo: data.showLogo ?? true,
    showName: data.showName ?? true,
    specialLabel: data.specialLabel?.trim().slice(0, 15) || "Sugerencia",
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
      websiteUrl: data.websiteUrl,
      showLogo: data.showLogo,
      showName: data.showName,
      specialLabel: data.specialLabel.trim().slice(0, 15) || "Sugerencia",
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

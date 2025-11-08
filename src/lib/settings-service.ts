// src/lib/settings-service.ts
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

const settingsDocRef = doc(db, "settings", "restaurant");

export type RestaurantSettings = {
  name: string;
  currency: string;
  logoUrl: string; // URL final (de Storage o la que escribas a mano)
};

/**
 * Lee la configuración del restaurante desde Firestore.
 * Si no existe, devuelve valores por defecto.
 */
export async function getRestaurantSettings(): Promise<RestaurantSettings> {
  const snap = await getDoc(settingsDocRef);

  if (!snap.exists()) {
    // valores por defecto
    return {
      name: "Picaña",
      currency: "ARS",
      logoUrl: "",
    };
  }

  const data = snap.data() as any;

  return {
    name: data.name ?? "Picaña",
    currency: data.currency ?? "ARS",
    logoUrl: data.logoUrl ?? "",
  };
}

/**
 * Guarda la configuración del restaurante en Firestore.
 * NO sube archivos, solo guarda la URL resultante.
 */
export async function saveRestaurantSettings(
  data: RestaurantSettings
): Promise<void> {
  await setDoc(
    settingsDocRef,
    {
      name: data.name,
      currency: data.currency,
      logoUrl: data.logoUrl,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

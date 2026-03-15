import { db } from "@/lib/firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

export type FridayData = {
  entrada: string;
  postre: string;
};

const DEFAULTS: FridayData = {
  entrada: "",
  postre: "",
};

/**
 * Obtiene los datos del menú del viernes una sola vez (one-shot).
 */
export async function getFridayData(tenantId: string = "picana"): Promise<FridayData> {
  const ref = doc(db, "tenants", tenantId, "special_menus", "friday");
  const snap = await getDoc(ref);

  if (snap.exists()) return snap.data() as FridayData;

  // Fallback legacy para picana
  if (tenantId === "picana") {
    const legacyRef = doc(db, "menu_viernes", "data");
    const legacySnap = await getDoc(legacyRef);
    if (legacySnap.exists()) return legacySnap.data() as FridayData;
  }

  return DEFAULTS;
}

/**
 * Escucha cambios en tiempo real para el menú del viernes de un tenant.
 */
export function listenFridayData(tenantId: string, cb: (data: FridayData) => void) {
  const ref = doc(db, "tenants", tenantId, "special_menus", "friday");

  return onSnapshot(ref, (snap) => {
    if (snap.exists()) {
      cb(snap.data() as FridayData);
    } else if (tenantId === "picana") {
      // Intento de fallback legacy en tiempo real si el nuevo no existe
      const legacyRef = doc(db, "menu_viernes", "data");
      getDoc(legacyRef).then(lsnap => {
        if (lsnap.exists()) cb(lsnap.data() as FridayData);
        else cb(DEFAULTS);
      });
    } else {
      cb(DEFAULTS);
    }
  });
}

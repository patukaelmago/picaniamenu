import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export type FridayData = {
  entrada: string;
  postre: string;
};

const DEFAULTS: FridayData = {
  entrada: "",
  postre: "",
};

export async function getFridayData(): Promise<FridayData> {
  const ref = doc(db, "menu_viernes", "data"); // ✅ TU doc real
  const snap = await getDoc(ref);

  if (!snap.exists()) return DEFAULTS;

  const data = snap.data() as any;

  return {
    entrada: data.entrada ?? "",
    postre: data.postre ?? "",
  };
}

import { db } from "./firebase";
import { maidoDemo } from "@/demo-data/maido";

import {
  collection,
  doc,
  getDocs,
  writeBatch,
} from "firebase/firestore";

export async function restoreMaidoDemo() {
  const tenantId = "maido";
  const batch = writeBatch(db);

  // Restauraremos todo el tenant en los próximos pasos
}
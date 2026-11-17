import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// En App Hosting usa la cuenta de servicio del servidor (sin claves en el código).
const app = getApps()[0] ?? initializeApp({ projectId: "studio-4948282065-ea24d" });

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);

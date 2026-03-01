// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// ✅ Firebase Web Config (esto NO es secreto)
const firebaseConfig = {
  apiKey: "AIzaSyCK_WLBxq3bK2-LIc3MZEOCm1nHuEVDFey",
  authDomain: "studio-4948282065-ea24d.firebaseapp.com",
  projectId: "studio-4948282065-ea24d",
  storageBucket: "studio-4948282065-ea24d.firebasestorage.app",
  messagingSenderId: "542920346593",
  appId: "1:542920346593:web:8637c324e4e1f1ad4160a0",
};

// Guardrail (si te olvidás de pegar algo, falla claro)
for (const [k, v] of Object.entries(firebaseConfig)) {
  if (!v || String(v).includes("PEGA_ACA")) {
    throw new Error(`Firebase config incompleta: ${k}`);
  }
}

export const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCK_WLBxq3bK2-LIc3MZEOCm1rHuEVDfeY",
  authDomain: "studio-4948282065-ea24d.firebaseapp.com",
  projectId: "studio-4948282065-ea24d",
  storageBucket: "studio-4948282065-ea24d.firebasestorage.app",
  messagingSenderId: "542920346593",
  appId: "1:542920346593:web:8637c324e4e1f1ad4160a0",
};

// Evita “Firebase app already exists” en hot-reload
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
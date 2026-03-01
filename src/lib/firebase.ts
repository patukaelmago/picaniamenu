import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCK_WLBxq3bK2-LIc3MZE0Cm1rhUEVDFeY",
  authDomain: "studio-4948282065-ea24d.firebaseapp.com",
  projectId: "studio-4948282065-ea24d",
  storageBucket: "studio-4948282065-ea24d.firebasestorage.app",
  messagingSenderId: "542920346593",
  appId: "1:542920346593:web:8637c324e4e1f1ad4160a0",
};

export const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCK_WLBxq3bK2-LIc3MZEOCm1rHuEVDfeY",
  authDomain: "studio-4948282065-ea24d.firebaseapp.com",
  projectId: "studio-4948282065-ea24d",
  storageBucket: "studio-4948282065-ea24d.firebasestorage.app",
  messagingSenderId: "542920346593",
  appId: "1:542920346593:web:8637c324e4e1f1ad4160a0",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
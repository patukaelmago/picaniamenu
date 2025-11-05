// src/app/menu/page.tsx
import MenuClient from "../menu/menu-client";

export default function MenuPage() {
  // MenuClient va a leer los platos desde Firestore
  return <MenuClient />;
}

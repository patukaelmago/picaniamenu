// src/lib/types.ts
import type { Timestamp } from "firebase/firestore";

export type DietaryTag = "sin TACC" | "veggie";
export type SpecialTag = "Especial" | "Sin stock";

// Firestore suele devolver Timestamp; a veces vos lo convertís a Date.
export type FirestoreDate = Date | Timestamp;

// -------------------------
// 🥩 MENU ITEMS
// -------------------------
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  imageUrl: string;
  imageId: string;
  categoryId: string;
  isVisible: boolean;
  inStock: boolean;
  isSpecial: boolean;
  tags: (DietaryTag | SpecialTag)[];
  allergens: string[];
  searchKeywords: string[];
  order: number;
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
}

// Tipo auxiliar para formularios (crear/editar)
export type MenuItemInput = Omit<MenuItem, "id" | "createdAt" | "updatedAt">;

// -------------------------
// 📂 CATEGORIES
// -------------------------
export interface Category {
  id: string;
  name: string;
  order: number;
  isVisible: boolean;
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
  parentCategoryId?: string | null;
}

// -------------------------
// ⚙️ RESTAURANT SETTINGS
// -------------------------
export interface RestaurantSettings {
  restaurantName: string;
  logoUrl: string;
  currency: string;
  theme: {
    primary: string;
    secondary: string;
    accent: string;
  };
  publishedAt: FirestoreDate | null;
}

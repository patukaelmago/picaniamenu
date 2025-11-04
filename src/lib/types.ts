// src/lib/types.ts

export type DietaryTag = "sin TACC" | "veggie";
export type SpecialTag = "Especial" | "Sin stock";

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
  createdAt: Date;
  updatedAt: Date;
}

// 👉 Este lo agregamos para alta/edición desde el formulario:
export type MenuItemInput = Omit<MenuItem, "id" | "createdAt" | "updatedAt">;

export interface Category {
  id: string;
  name: string;
  order: number;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RestaurantSettings {
  restaurantName: string;
  logoUrl: string;
  currency: string;
  theme: {
    primary: string;
    secondary: string;
    accent: string;
  };
  publishedAt: Date | null;
}

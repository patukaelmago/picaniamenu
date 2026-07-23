import type { TenantUI } from "./ui-types";

// ===============================
// PALETA DE COLORES (HSL)
// ===============================

// ⚪ Blanco ............. 0 0% 100%
// 🟨 Crema (Picaña) .... 43 100% 94%
// 🔵 Azul Picaña ....... 220 50% 23%
// ⚫ Negro .............. 0 0% 0%
// ⚪ Gris claro ......... 0 0% 90%
// ⚫ Gris medio ......... 0 0% 50%
// ⚫ Gris oscuro ........ 0 0% 20%
// 🟢 Verde oscuro ...... 120 55% 28%
// 🟢 Verde medio ....... 120 55% 40%
// 🟢 Verde claro ....... 120 55% 70%
// 🔴 Rojo ............... 0 84% 60%
// 🟠 Naranja ............ 24 100% 56%
// 🟡 Dorado ............. 45 85% 55%

export const DEFAULT_TENANT_UI: TenantUI = {
  menuTemplate: "default",

  logoLight: "",
  logoDark: "",

  navBg: "222 51% 23%",
  navText: "0 0% 100%",
  accent: "222 51% 23%",

  searchIcon: "0 0% 100%",
  searchText: "0 0% 100%",

  background: "0 0% 100%",
  foreground: "222 51% 23%",

  categoryTitle: "222 51% 23%",
  categoryNav: "0 0% 100%",
  descriptionText: "0 0% 100%",
  categoryNavHover: "0 0% 100%",

  specialBadgeText: "24 100% 56%",
  specialBadgeBorder: "24 100% 56%",
  specialBadgeBg: "24 100% 56%",

  subCategoryTitle: "43 100% 94%",
  itemPrice: "43 100% 94%",

  showFriday: false,

  adminBackground: "0 0% 100%",
  adminForeground: "222 51% 23%",

  adminCard: "0 0% 100%",
  adminCardForeground: "222 51% 23%",

  adminSidebarBg: "0 0% 100%",
  adminSidebarText: "222 51% 23%",

  adminAccent: "24 100% 56%",
};
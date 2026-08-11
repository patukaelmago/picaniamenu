import type { TenantUI } from "./ui-types";

// ==================================================
// MAIDO
// Azul profundo + rojo del logo + crema cálido
// ==================================================

export const MAIDO_UI: Partial<TenantUI> = {
  menuTemplate: "editorial",

  accent: "355 88% 45%",

  categoryNav: "222 50% 23%",
  categoryNavHover: "355 88% 45%",
  showDesktopCategoryList: true,

  specialBadgeText: "0 0% 100%",
  specialBadgeBorder: "355 88% 45%",
  specialBadgeBg: "355 88% 45%",

  adminBackground: "40 24% 96%",
  adminForeground: "222 50% 23%",
  adminMutedForeground: "220 9% 46%",

  adminCard: "0 0% 100%",
  adminCardForeground: "222 50% 23%",

  adminSidebarBg: "222 50% 23%",
  adminSidebarText: "43 100% 94%",

  adminAccent: "355 88% 45%",
  adminDelete: "355 88% 45%",

  adminAccountMenuBg: "0 0% 100%",
  adminAccountMenuText: "222 50% 23%",
};

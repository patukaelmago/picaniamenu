export type TenantUI = {
  logoLight: string;
  logoDark: string;
  navBg: string;
  navText: string;
  accent: string;
  searchIcon: string;
  searchText: string;
  background: string;
  foreground: string;
  categoryTitle: string;
  categoryNav: string;
  descriptionText: string;
  categoryNavHover: string;
  specialBadgeText: string;
  specialBadgeBorder: string;
  specialBadgeBg: string;
  subCategoryTitle: string;
  itemPrice: string;
  showFriday: boolean;
  adminBackground: string;
  adminForeground: string;

  adminSidebarBg: string;
  adminSidebarText: string;

  adminAccent: string;
};

const DEFAULT: TenantUI = {
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

  adminSidebarBg: "0 0% 100%",
  adminSidebarText: "222 51% 23%",

  adminAccent: "222 51% 23%",
};

const TENANTS: Record<string, Partial<TenantUI>> = {
  // ==================================================
  // PICAÑA
  // Azul oscuro + crema
  // ==================================================
  picana: {
    logoLight: "",
    logoDark: "",

    navBg: "43 100% 94%", // Fondo sidebar
    navText: "220 50% 23%", // Texto sidebar

    accent: "220 50% 23%",

    searchIcon: "220 50% 23%",
    searchText: "220 50% 23%",
    background: "222 50% 23%",
    foreground: "43 100% 94%",
    categoryTitle: "43 100% 94%",
    categoryNav: "0 0% 100%",
    descriptionText: "0 0% 100%",
    categoryNavHover: "43 100% 94%",
    specialBadgeText: "0 0% 0%",
    specialBadgeBorder: "24 100% 56%",
    specialBadgeBg: "24 100% 56%",

    subCategoryTitle: "0 0% 100%",
    itemPrice: "220 50% 23%",

    showFriday: true,

    adminBackground: "120 20% 95%",
    adminForeground: "120 50% 15%",

    adminSidebarBg: "120 55% 28%",
    adminSidebarText: "0 0% 100%",

    adminAccent: "120 55% 40%",
  },

  // ==================================================
  // LA ROTI
  // Negro + dorado
  // ==================================================
  laroti: {
    logoLight: "",
    logoDark: "",

    navBg: "0 0% 0%",
    navText: "45 85% 55%",

    accent: "45 85% 55%",

    searchIcon: "45 85% 55%",
    searchText: "0 0% 0%",

    background: "45 85% 55%",
    foreground: "0 0% 0%",

    categoryTitle: "0 0% 0%",
    categoryNav: "0 0% 0%",
    descriptionText: "0 0% 0%",
    categoryNavHover: "0 0% 0%",

    specialBadgeText: "0 0% 0%",
    specialBadgeBorder: "24 100% 56%",
    specialBadgeBg: "24 100% 56%",

    subCategoryTitle: "0 0% 0%",
    itemPrice: "0 0% 0%",

    showFriday: false,

    adminBackground: "0 0% 8%",
    adminForeground: "45 85% 55%",

    adminSidebarBg: "0 0% 0%",
    adminSidebarText: "45 85% 55%",

    adminAccent: "45 85% 55%",
  },

  // ==================================================
  // PULPO
  // Azul marino + crema
  // ==================================================
  pulpo: {
    logoLight: "",
    logoDark: "",

    navBg: "220 50% 23%",
    navText: "0 0% 100%",

    accent: "14 84% 53%",

    searchIcon: "220 50% 23%",
    searchText: "220 50% 23%",

    background: "43 100% 94%",
    foreground: "220 50% 23%",

    categoryTitle: "220 50% 23%",
    categoryNav: "220 50% 23%",
    descriptionText: "220 50% 23%",
    categoryNavHover: "220 50% 23%",

    specialBadgeText: "0 0% 0%",
    specialBadgeBorder: "24 100% 56%",
    specialBadgeBg: "24 100% 56%",

    subCategoryTitle: "220 50% 23%",
    itemPrice: "220 50% 23%",

    showFriday: false,

    adminBackground: "43 100% 94%",
    adminForeground: "220 50% 23%",

    adminSidebarBg: "220 50% 23%",
    adminSidebarText: "43 100% 94%",

    adminAccent: "14 84% 53%",
  },

  // ==================================================
  // SUCRE
  // Verde + dorado claro
  // ==================================================
  sucre: {
    logoLight: "",
    logoDark: "",

    navBg: "178 73% 25%",
    navText: "45 33% 63%",

    accent: "45 33% 63%",

    searchIcon: "45 33% 63%",
    searchText: "178 73% 25%",

    background: "45 33% 63%",
    foreground: "178 73% 25%",

    categoryTitle: "178 73% 25%",
    categoryNav: "178 73% 25%",
    descriptionText: "178 73% 25%",
    categoryNavHover: "178 73% 25%",

    specialBadgeText: "0 0% 0%",
    specialBadgeBorder: "24 100% 56%",
    specialBadgeBg: "24 100% 56%",

    subCategoryTitle: "178 73% 25%",
    itemPrice: "178 73% 25%",

    showFriday: false,

    adminBackground: "45 33% 63%",
    adminForeground: "178 73% 25%",

    adminSidebarBg: "178 73% 25%",
    adminSidebarText: "45 33% 63%",

    adminAccent: "45 33% 63%",
  },
};

export function getTenantUI(tenantId?: string | null): TenantUI {
  const key = (tenantId ?? "").toLowerCase();
  const config = TENANTS[key] || {};
  return { ...DEFAULT, ...config };
}
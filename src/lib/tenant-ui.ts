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
};

const TENANTS: Record<string, Partial<TenantUI>> = {

  picana: {
    logoLight: "",
    logoDark: "",
    navBg: "43 100% 94%",
    navText: "210 52% 22%",
    accent: "210 52% 22%",
    searchIcon: "43 100% 94%",
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
    itemPrice: "43 100% 94%",
    showFriday: true,
  },

  laroti: {
    logoLight: "",
    logoDark: "",
    navBg: "0 0% 0%",
    navText: "45 85% 55%",
    accent: "45 85% 55%",
    searchIcon: "45 85% 55%",
    searchText: "210 52% 22%",
    background: "45 85% 55%",
    foreground: "0 0% 0%",
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
  },

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
    categoryTitle: "222 50% 23%",
    categoryNav: "222 50% 23%",
    descriptionText: "0 0% 0%",
    categoryNavHover: "0 0% 100%",
    specialBadgeText: "0 0% 0%",
    specialBadgeBorder: "24 100% 56%",
    specialBadgeBg: "24 100% 56%",
    subCategoryTitle: "43 100% 94%",
    itemPrice: "43 100% 94%",
    showFriday: false,
  },

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
  },
};

export function getTenantUI(tenantId?: string | null): TenantUI {
  const key = (tenantId ?? "").toLowerCase();
  const config = TENANTS[key] || {};
  return { ...DEFAULT, ...config };
}
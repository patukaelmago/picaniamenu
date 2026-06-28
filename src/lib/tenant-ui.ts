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

  // ===== MENÚ PÚBLICO =====

  navBg: "43 100% 94%", // Fondo de la barra de navegación
  navText: "220 50% 23%", // Texto e íconos de la barra de navegación

  accent: "220 50% 23%", // Botones, links y elementos destacados

  searchIcon: "220 50% 23%", // Ícono de búsqueda
  searchText: "220 50% 23%", // Texto del buscador

  background: "222 50% 23%", // Fondo general del menú público
  foreground: "43 100% 94%", // Texto general del menú público

  categoryTitle: "43 100% 94%", // Título de las categorías
  categoryNav: "0 0% 100%", // Subcategorías / navegación
  descriptionText: "0 0% 100%", // Descripción de los productos
  categoryNavHover: "43 100% 94%", // Hover de categorías

  specialBadgeText: "0 0% 0%", // Texto de la etiqueta "Sugerencia"
  specialBadgeBorder: "24 100% 56%", // Borde de la etiqueta
  specialBadgeBg: "24 100% 56%", // Fondo de la etiqueta

  subCategoryTitle: "0 0% 100%", // Título de subcategorías
  itemPrice: "220 50% 23%", // Precio del producto

  showFriday: true,

  // ===== ADMIN =====

  adminBackground: "220 50% 23%", // Fondo principal del admin y de las tarjetas (bg-card)
  adminForeground: "0 84% 60%", // Texto principal del admin y de las tarjetas

  adminSidebarBg: "120 55% 28%", // Fondo del menú lateral del admin
  adminSidebarText: "0 0% 100%", // Texto e íconos del menú lateral

  adminAccent: "120 55% 40%", // Botones, switches, enlaces y elementos destacados del admin
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
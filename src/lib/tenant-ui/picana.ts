import type { TenantUI } from "./ui-types";

// ==================================================
// PICAÑA
// Azul oscuro + crema
// ==================================================

export const PICANA_UI: Partial<TenantUI> = {
  menuTemplate: "editorial",

  logoLight: "",
  logoDark: "",

  // ===== MENÚ PÚBLICO =====

  navBg: "43 100% 94%", // Fondo de la barra de navegación
  navText: "222 50% 23%", // Texto e íconos de la barra de navegación

  accent: "222 50% 23%", // Botones, links y elementos destacados

  searchIcon: "222 50% 23%", // Ícono de búsqueda
  searchText: "222 50% 23%", // Texto del buscador

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

  adminBackground: "222 50% 23%", // Fondo principal del admin
  adminForeground: "0 0% 100%", // Texto principal del admin

  adminCard: "43 100% 94%", // Fondo de las tarjetas del admin
  adminCardForeground: "222 50% 23%", // Texto de las tarjetas del admin

  adminSidebarBg: "222 50% 23%", // Fondo del menú lateral del admin
  adminSidebarText: "0 0% 100%", // Texto e íconos del menú lateral

  adminAccent: "14 84% 53%", // Naranja
};
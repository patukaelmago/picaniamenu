export type MenuTemplate = "default" | "editorial";

export type TenantUI = {
  menuTemplate: MenuTemplate;

  logoLight: string;
  logoDark: string;

  // ===== MENÚ PÚBLICO =====

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

  // ===== ADMIN =====

  adminBackground: string;
  adminForeground: string;

  adminCard: string;
  adminCardForeground: string;

  adminSidebarBg: string;
  adminSidebarText: string;

  adminAccent: string;
};
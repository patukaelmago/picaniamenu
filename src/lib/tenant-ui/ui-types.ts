export type MenuTemplate = "default" | "editorial";
export type AdminHomeSection = "menu" | "almuerzo";

export type TenantUI = {
  menuTemplate: MenuTemplate;
  adminHomeSection?: AdminHomeSection;

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
  categoryTitleUnderline: string;
  categoryNav: string;
  descriptionText: string;
  categoryNavHover: string;
  categoryNavUnderline: string;
  itemDivider: string;
  menuPageBorder: string;

  specialBadgeText: string;
  specialBadgeBorder: string;
  specialBadgeBg: string;

  subCategoryTitle: string;
  itemPrice: string;

  showFriday: boolean;
  showDesktopCategoryList: boolean;
  showCategorySelector: boolean;

  // ===== ADMIN =====

  adminBackground: string;
  adminForeground: string;
  adminMutedForeground: string;

  adminCard: string;
  adminCardForeground: string;

  adminSidebarBg: string;
  adminSidebarText: string;

  adminAccent: string;
  adminDelete: string;
  adminAccountMenuBg: string;
  adminAccountMenuText: string;
};

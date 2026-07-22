export type MenuTemplate = "default" | "editorial";

export type TenantUI = {
  menuTemplate: MenuTemplate;

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
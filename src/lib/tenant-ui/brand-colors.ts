import type { TenantUI } from "./ui-types";

export type BrandColors = {
  primary?: string;
  background?: string;
  accent?: string;
};

export const TENANT_COLOR_FIELDS = [
  { key: "navBg", label: "Fondo del encabezado", group: "Carta pública" },
  { key: "navText", label: "Texto del encabezado", group: "Carta pública" },
  { key: "accent", label: "Acento general", group: "Carta pública" },
  { key: "searchIcon", label: "Ícono del buscador", group: "Carta pública" },
  { key: "searchText", label: "Texto del buscador", group: "Carta pública" },
  { key: "background", label: "Fondo de la carta", group: "Carta pública" },
  { key: "foreground", label: "Texto general", group: "Carta pública" },
  { key: "categoryTitle", label: "Títulos de categorías", group: "Carta pública" },
  { key: "categoryTitleUnderline", label: "Subrayado de títulos", group: "Carta pública" },
  { key: "categoryNav", label: "Selector de categorías", group: "Carta pública" },
  { key: "categoryNavHover", label: "Hover de categorías", group: "Carta pública" },
  { key: "categoryNavUnderline", label: "Subrayado del selector", group: "Carta pública" },
  { key: "itemDivider", label: "Líneas entre platos", group: "Carta pública" },
  { key: "menuPageBorder", label: "Borde de las hojas", group: "Carta pública" },
  { key: "descriptionText", label: "Descripciones", group: "Carta pública" },
  { key: "subCategoryTitle", label: "Subcategorías", group: "Carta pública" },
  { key: "itemPrice", label: "Precios", group: "Carta pública" },
  { key: "specialBadgeBg", label: "Fondo de sugerencia", group: "Carta pública" },
  { key: "specialBadgeText", label: "Texto de sugerencia", group: "Carta pública" },
  { key: "specialBadgeBorder", label: "Borde de sugerencia", group: "Carta pública" },
  { key: "adminBackground", label: "Fondo del panel", group: "Administración" },
  { key: "adminForeground", label: "Texto general", group: "Administración" },
  { key: "adminMutedForeground", label: "Texto secundario", group: "Administración" },
  { key: "adminCard", label: "Fondo de tarjetas", group: "Administración" },
  { key: "adminCardForeground", label: "Texto de tarjetas", group: "Administración" },
  { key: "adminSidebarBg", label: "Fondo del menú lateral", group: "Administración" },
  { key: "adminSidebarText", label: "Texto e íconos laterales", group: "Administración" },
  { key: "adminAccent", label: "Botones, switches y hover", group: "Administración" },
  { key: "adminDelete", label: "Íconos de eliminar", group: "Administración" },
  { key: "adminAccountMenuBg", label: "Fondo de la cuenta", group: "Administración" },
  { key: "adminAccountMenuText", label: "Texto de la cuenta", group: "Administración" },
] as const satisfies ReadonlyArray<{
  key: keyof TenantUI;
  label: string;
  group: "Carta pública" | "Administración";
}>;

export type TenantColorKey = (typeof TENANT_COLOR_FIELDS)[number]["key"];
export type TenantColorOverrides = Partial<Record<TenantColorKey, string>>;

function validColor(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function applyBrandColors(base: TenantUI, colors?: BrandColors): TenantUI {
  if (!colors) return base;

  const primary = validColor(colors.primary) ? colors.primary.trim() : base.navBg;
  const background = validColor(colors.background)
    ? colors.background.trim()
    : base.background;
  const accent = validColor(colors.accent) ? colors.accent.trim() : base.accent;

  return {
    ...base,
    navBg: primary,
    navText: background,
    accent,
    searchIcon: primary,
    searchText: primary,
    background,
    foreground: primary,
    categoryTitle: primary,
    categoryTitleUnderline: primary,
    categoryNav: primary,
    descriptionText: primary,
    categoryNavHover: accent,
    categoryNavUnderline: primary,
    itemDivider: primary,
    menuPageBorder: primary,
    specialBadgeText: background,
    specialBadgeBorder: accent,
    specialBadgeBg: accent,
    subCategoryTitle: primary,
    itemPrice: primary,
    adminBackground: primary,
    adminForeground: background,
    adminMutedForeground: background,
    adminCard: background,
    adminCardForeground: primary,
    adminSidebarBg: primary,
    adminSidebarText: background,
    adminAccent: accent,
    adminDelete: accent,
    adminAccountMenuBg: background,
    adminAccountMenuText: primary,
  };
}

export function applyColorOverrides(
  base: TenantUI,
  overrides?: Record<string, unknown>
): TenantUI {
  if (!overrides) return base;

  const next = { ...base };
  TENANT_COLOR_FIELDS.forEach(({ key }) => {
    const value = overrides[key];
    if (validColor(value)) {
      next[key] = value.trim();
    }
  });
  return next;
}

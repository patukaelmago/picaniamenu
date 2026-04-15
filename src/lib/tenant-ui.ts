export type TenantUI = {
  logoLight: string;
  logoDark: string;
  navBg: string;
  navText: string;
  accent: string;
  showFriday: boolean;
};

const DEFAULT: TenantUI = {
  logoLight: "/logorecortado_azul.png",
  logoDark: "/logorecortado_azul.png",
  navBg: "222 51% 23%",
  navText: "0 0% 100%",
  accent: "222 51% 23%",
  showFriday: false,
};

const TENANTS: Record<string, Partial<TenantUI>> = {
  picana: {
    logoLight: "/logorecortado_azul.png",
    logoDark: "/logorecortado_azul.png",
    navBg: "222 51% 23%",
    navText: "0 0% 100%",
    accent: "222 51% 23%",
    showFriday: true,
  },
  laroti: {
    navBg: "222 51% 23%",
    navText: "0 0% 100%",
    accent: "222 51% 23%",
    showFriday: false,
  },
};

export function getTenantUI(tenantId?: string | null): TenantUI {
  const key = (tenantId ?? "").toLowerCase();
  const config = TENANTS[key] || {};
  return { ...DEFAULT, ...config };
}
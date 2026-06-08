export type TenantUI = {
  logoLight: string;
  logoDark: string;
  navBg: string;
  navText: string;
  accent: string;
  showFriday: boolean;
};

const DEFAULT: TenantUI = {
  logoLight: "",
  logoDark: "",
  navBg: "222 51% 23%",
  navText: "0 0% 100%",
  accent: "222 51% 23%",
  showFriday: false,
};

const TENANTS: Record<string, Partial<TenantUI>> = {
  picana: {
    logoLight: "",
    logoDark: "",
    navBg: "43 100% 94%",
    navText: "210 52% 22%",
    accent: "210 52% 22%",
    showFriday: true,
  },

  laroti: {
    logoLight: "",
    logoDark: "",
    navBg: "222 51% 23%",
    navText: "0 0% 100%",
    accent: "222 51% 23%",
    showFriday: false,
  },

  pulpo: {
    logoLight: "",
    logoDark: "",
    navBg: "220 50% 23%",
    navText: "0 0% 100%",
    accent: "14 84% 53%",
    showFriday: false,
  },

  sucre: {
    logoLight: "",
    logoDark: "",
    navBg: "178 73% 25%",
    navText: "45 33% 63%",
    accent: "45 33% 63%",
    showFriday: false,
  },
};

export function getTenantUI(tenantId?: string | null): TenantUI {
  const key = (tenantId ?? "").toLowerCase();
  const config = TENANTS[key] || {};
  return { ...DEFAULT, ...config };
}
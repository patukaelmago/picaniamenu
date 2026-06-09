export type TenantTheme = {
  logoLight: string;
  logoDark: string;

  navBg: string;
  navText: string;

  accent: string;

  footerBg?: string;

  scrollButtonBg: string;
  scrollButtonText: string;
};

const THEMES: Record<string, TenantTheme> = {
  picana: {
    logoLight: "/logorecortado_azul.png",
    logoDark: "/logorecortado.png",

    navBg: "210 52% 22%",
    navText: "43 100% 94%",
    accent: "43 74% 64%",

    scrollButtonBg: "43 100% 94%",
    scrollButtonText: "210 52% 22%",
  },

  laroti: {
    logoLight: "/laroti_logo_light.png",
    logoDark: "/laroti_logo_dark.png",

    navBg: "30 25% 92%",
    navText: "210 35% 18%",
    accent: "18 70% 45%",

    scrollButtonBg: "30 25% 92%",
    scrollButtonText: "210 35% 18%",
  },

  pulpo: {
    logoLight: "",
    logoDark: "",

    navBg: "220 50% 23%",
    navText: "0 0% 100%",
    accent: "14 84% 53%",

    scrollButtonBg: "0 0% 100%",
    scrollButtonText: "220 50% 23%",
  },

  sucre: {
    logoLight: "",
    logoDark: "",

    navBg: "178 73% 25%",
    navText: "45 33% 63%",
    accent: "45 33% 63%",

    scrollButtonBg: "45 33% 63%",
    scrollButtonText: "178 73% 25%",
  },
};

export function getTenantTheme(
  tenantId?: string | null
): TenantTheme {
  return THEMES[(tenantId ?? "").toLowerCase()] ?? THEMES.picana;
}
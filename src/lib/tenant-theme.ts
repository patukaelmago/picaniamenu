export type TenantTheme = {
    logoLight: string;
    logoDark: string;
    navBg: string;     // hsl o hex
    navText: string;
    accent: string;
    footerBg?: string;
  };
  
  const THEMES: Record<string, TenantTheme> = {
    picana: {
      logoLight: "/logorecortado_azul.png",
      logoDark: "/logorecortado.png",
      navBg: "210 52% 22%",     // ejemplo
      navText: "43 100% 94%",
      accent: "43 74% 64%",
    },
    laroti: {
      logoLight: "/laroti_logo_light.png",
      logoDark: "/laroti_logo_dark.png",
      navBg: "30 25% 92%",
      navText: "210 35% 18%",
      accent: "18 70% 45%",
    },
  };
  
  export function getTenantTheme(tenantId?: string | null): TenantTheme {
    return THEMES[(tenantId ?? "").toLowerCase()] ?? THEMES.picana;
  }
  
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
    logoDark: "/logorecortado.png",
    navBg: "210 52% 22%",   // Azul oscuro
    navText: "43 100% 94%", // Beige claro
    accent: "43 74% 64%",
    showFriday: false,      // Por defecto desactivado para SaaS
  };
  
  const TENANTS: Record<string, Partial<TenantUI>> = {
    picana: {
      navBg: "210 52% 22%",
      navText: "43 100% 94%",
      accent: "43 74% 64%",
      showFriday: true, // Solo Picaña tiene activado el almuerzo de viernes
    },
    laroti: {
      navBg: "40 25% 92%",
      navText: "210 35% 18%",
      accent: "18 70% 45%",
      showFriday: false,
    },
  };
  
  export function getTenantUI(tenantId?: string | null): TenantUI {
    const key = (tenantId ?? "").toLowerCase();
    const config = TENANTS[key] || {};
    return { ...DEFAULT, ...config };
  }

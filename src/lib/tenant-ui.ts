export type TenantUI = {
    logoLight: string;
    logoDark: string;
    // colores en HSL (sin hsl(...)) porque vos usás hsl(var(--...))
    navBg: string;
    navText: string;
    accent: string;
    showFriday: boolean;
  };
  
  const DEFAULT: TenantUI = {
    logoLight: "/logorecortado_azul.png",
    logoDark: "/logorecortado.png",
    navBg: "210 52% 22%",   // azul
    navText: "43 100% 94%", // cremita
    accent: "43 74% 64%",
    showFriday: true,
  };
  
  const TENANTS: Record<string, Partial<TenantUI>> = {
    laroti: {
      logoLight: "/laroti_logo_light.png",
      logoDark: "/laroti_logo_dark.png",
      navBg: "40 25% 92%",
      navText: "210 35% 18%",
      accent: "18 70% 45%",
      showFriday: false, // ✅ La Roti sin “Almuerzo Viernes”
    },
  };
  
  export function getTenantUI(tenantId?: string | null): TenantUI {
    const key = (tenantId ?? "").toLowerCase();
    return { ...DEFAULT, ...(TENANTS[key] ?? {}) };
  }
  
import type { TenantBrandingColors } from "@/types/branding";

/**
 * Colores default del sistema (tema Picaña original)
 * Se usan como fallback si no hay datos en Firestore
 */
export const DEFAULT_BRANDING_COLORS: TenantBrandingColors = {
  light: {
    // Beige/Cream base
    background: "40 38% 85%",
    foreground: "0 0% 4.3%",

    // Cards
    card: "40 38% 85%",
    cardForeground: "0 0% 4.3%",
    popover: "40 38% 85%",
    popoverForeground: "0 0% 4.3%",

    // Navigation
    navBg: "222 50% 23%",
    navText: "0 0% 100%",

    // Primary / Secondary
    primary: "0 0% 4.3%",
    primaryForeground: "0 0% 98%",
    secondary: "40 10% 85%",
    secondaryForeground: "0 0% 4.3%",

    // Muted
    muted: "40 10% 85%",
    mutedForeground: "0 0% 40%",

    // Accent (Azul marino)
    accent: "222 50% 23%",
    accentForeground: "0 0% 98%",

    // Destructive
    destructive: "0 84.2% 60.2%",
    destructiveForeground: "0 0% 98%",

    // Borders & Inputs
    border: "0 0% 80%",
    input: "0 0% 80%",
    ring: "222 50% 23%",

    // Charts
    chart1: "12 76% 61%",
    chart2: "173 58% 39%",
    chart3: "197 37% 24%",
    chart4: "43 74% 66%",
    chart5: "27 87% 67%",

    // Sidebar
    sidebarBackground: "0 0% 98%",
    sidebarForeground: "240 5.3% 26.1%",
    sidebarPrimary: "240 5.9% 10%",
    sidebarPrimaryForeground: "0 0% 98%",
    sidebarAccent: "240 4.8% 95.9%",
    sidebarAccentForeground: "240 5.9% 10%",
    sidebarBorder: "220 13% 91%",
    sidebarRing: "217.2 91.2% 59.8%",
  },
  dark: {
    // Dark background
    background: "0 0% 4.3%",
    foreground: "40 38% 85%",

    // Cards
    card: "0 0% 4.3%",
    cardForeground: "40 38% 85%",
    popover: "0 0% 4.3%",
    popoverForeground: "40 38% 85%",

    // Navigation (igual que light)
    navBg: "222 50% 23%",
    navText: "0 0% 100%",

    // Primary / Secondary
    primary: "0 0% 98%",
    primaryForeground: "0 0% 4.3%",
    secondary: "0 0% 10%",
    secondaryForeground: "40 38% 85%",

    // Muted
    muted: "0 0% 10%",
    mutedForeground: "40 33% 70%",

    // Accent (Dorado/Cremita)
    accent: "43 74% 64%",
    accentForeground: "0 0% 4.3%",

    // Destructive
    destructive: "0 62.8% 30.6%",
    destructiveForeground: "0 0% 98%",

    // Borders & Inputs
    border: "0 0% 15%",
    input: "0 0% 15%",
    ring: "43 74% 64%",

    // Charts
    chart1: "220 70% 50%",
    chart2: "160 60% 45%",
    chart3: "30 80% 55%",
    chart4: "280 65% 60%",
    chart5: "340 75% 55%",

    // Sidebar
    sidebarBackground: "0 0% 4.3%",
    sidebarForeground: "240 4.8% 95.9%",
    sidebarPrimary: "39 44% 51%",
    sidebarPrimaryForeground: "0 0% 98%",
    sidebarAccent: "0 0% 12%",
    sidebarAccentForeground: "240 4.8% 95.9%",
    sidebarBorder: "0 0% 15%",
    sidebarRing: "39 44% 51%",
  },
  radius: "0.5rem",
};

/**
 * Colores específicos para Picaña
 * Se guardan en Firestore en: tenants/picana/branding/colors
 */
export const PICANA_BRANDING_COLORS: TenantBrandingColors = DEFAULT_BRANDING_COLORS;

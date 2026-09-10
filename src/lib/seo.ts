export const SITE_URL = "https://carta-online.com";

export const PUBLIC_TENANTS = [
  "maido",
  "picana",
  "pulpo",
  "laroti",
  "sucre",
] as const;

export const tenantDisplayName = (tenantId: string) =>
  tenantId
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const jsonLd = (value: unknown) =>
  JSON.stringify(value).replace(/</g, "\\u003c");

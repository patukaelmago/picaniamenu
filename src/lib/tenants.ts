export const DEFAULT_TENANT = "picana";

export const TENANTS = {
  picana: { name: "Picaña" },
  laroti: { name: "La Roti" },
} as const;

export type TenantId = keyof typeof TENANTS;

export const isTenant = (s: string): s is TenantId => s in TENANTS;

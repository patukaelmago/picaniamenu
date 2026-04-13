export const DEFAULT_TENANT = "picana";

export const isTenant = (s: string): boolean => {
  return typeof s === "string" && s.trim().length > 0;
};

export type TenantId = string;
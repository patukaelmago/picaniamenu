import { DEFAULT_TENANT_UI } from "./default";
import { PICANA_UI } from "./picana";
import { LAROTI_UI } from "./laroti";
import { PULPO_UI } from "./pulpo";
import { SUCRE_UI } from "./sucre";

import type { TenantUI } from "./ui-types";

const TENANTS: Record<string, Partial<TenantUI>> = {
  picana: PICANA_UI,
  laroti: LAROTI_UI,
  pulpo: PULPO_UI,
  sucre: SUCRE_UI,
};

export function getTenantUI(tenantId?: string | null): TenantUI {
  const key = (tenantId ?? "").toLowerCase();
  const config = TENANTS[key] || {};

  return {
    ...DEFAULT_TENANT_UI,
    ...config,
  };
}

export type { MenuTemplate, TenantUI } from "./ui-types";
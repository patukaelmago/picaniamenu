"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { getTenantUI, type TenantUI } from "@/lib/tenant-ui";
import {
  applyBrandColors,
  applyColorOverrides,
} from "@/lib/tenant-ui/brand-colors";

export function useTenantUI(tenantId?: string | null): TenantUI {
  return useTenantUIState(tenantId).ui;
}

// Igual que useTenantUI, pero además avisa cuándo terminaron de cargar los colores del tenant.
export function useTenantUIState(tenantId?: string | null): { ui: TenantUI; ready: boolean } {
  const [ui, setUi] = useState<TenantUI>(() => getTenantUI(tenantId));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const base = getTenantUI(tenantId);
    setUi(base);
    setReady(false);

    if (!tenantId) {
      setReady(true);
      return () => {
        cancelled = true;
      };
    }

    getDoc(doc(db, "tenants", tenantId, "settings", "ui"))
      .then((snapshot) => {
        if (cancelled || !snapshot.exists()) return;
        const data = snapshot.data();
        const generated = applyBrandColors(base, data?.brandColors);
        const themed = applyColorOverrides(generated, data?.colorOverrides);
        setUi({
          ...themed,
          showDesktopCategoryList:
            data?.showDesktopCategoryList ?? base.showDesktopCategoryList,
          showCategorySelector:
            data?.showCategorySelector ?? base.showCategorySelector,
        });
      })
      .catch((error) => {
        console.error("Error cargando colores del tenant", error);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  return { ui, ready };
}

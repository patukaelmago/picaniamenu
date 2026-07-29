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
  const [ui, setUi] = useState<TenantUI>(() => getTenantUI(tenantId));

  useEffect(() => {
    let cancelled = false;
    const base = getTenantUI(tenantId);
    setUi(base);

    if (!tenantId) {
      return () => {
        cancelled = true;
      };
    }

    getDoc(doc(db, "tenants", tenantId, "settings", "ui"))
      .then((snapshot) => {
        if (cancelled || !snapshot.exists()) return;
        const data = snapshot.data();
        const generated = applyBrandColors(base, data?.brandColors);
        setUi(applyColorOverrides(generated, data?.colorOverrides));
      })
      .catch((error) => {
        console.error("Error cargando colores del tenant", error);
      });

    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  return ui;
}

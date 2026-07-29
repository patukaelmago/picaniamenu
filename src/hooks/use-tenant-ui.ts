"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { getTenantUI, type TenantUI } from "@/lib/tenant-ui";

type BrandColors = {
  primary?: string;
  background?: string;
  accent?: string;
};

function validColor(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function applyBrandColors(base: TenantUI, colors?: BrandColors): TenantUI {
  if (!colors) return base;

  const primary = validColor(colors.primary) ? colors.primary.trim() : base.navBg;
  const background = validColor(colors.background)
    ? colors.background.trim()
    : base.background;
  const accent = validColor(colors.accent) ? colors.accent.trim() : base.accent;

  return {
    ...base,

    navBg: primary,
    navText: background,
    accent,

    searchIcon: primary,
    searchText: primary,

    background,
    foreground: primary,

    categoryTitle: primary,
    categoryNav: primary,
    descriptionText: primary,
    categoryNavHover: accent,

    specialBadgeText: background,
    specialBadgeBorder: accent,
    specialBadgeBg: accent,

    subCategoryTitle: primary,
    itemPrice: primary,

    adminBackground: primary,
    adminForeground: background,
    adminMutedForeground: background,

    adminCard: background,
    adminCardForeground: primary,

    adminSidebarBg: primary,
    adminSidebarText: background,

    adminAccent: accent,
    adminDelete: accent,
    adminAccountMenuBg: background,
    adminAccountMenuText: primary,
  };
}

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
        setUi(applyBrandColors(base, snapshot.data()?.brandColors));
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

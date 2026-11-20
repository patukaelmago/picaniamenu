"use client";

import Footer from "@/components/footer";
import Header from "@/components/header";
import CartaOnlineLoader from "@/components/CartaOnlineLoader";
import { useTenantUIState } from "@/hooks/use-tenant-ui";
import { useRestaurantSettings } from "@/hooks/use-restaurant-settings";
import { usePathname } from "next/navigation";
import { useEffect, useState, type CSSProperties } from "react";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);
  const menuIndex = parts.indexOf("menu");
  const tenantId = menuIndex >= 0 ? parts[menuIndex + 1] : null;
  const { ui, ready: uiLoaded } = useTenantUIState(tenantId);
  const settings = useRestaurantSettings();
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setTimedOut(true), 4000);
    return () => window.clearTimeout(timer);
  }, []);
  // En la carta de un restaurante, tapar todo hasta tener sus colores y logo (evita ver el diseño por defecto).
  const showLoader = !!tenantId && !timedOut && (!uiLoaded || settings === null);

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{
        "--nav-bg": ui.navBg,
        "--nav-text": ui.navText,
        "--accent": ui.accent,
        "--search-icon": ui.searchIcon,
        backgroundColor: `hsl(${ui.background})`,
        color: `hsl(${ui.foreground})`,
      } as CSSProperties}
    >
      {showLoader && (
        <CartaOnlineLoader text="Cargando la carta…" className="fixed inset-0 z-[100]" />
      )}
      <Header />
      <main
        className="flex-grow"
        style={{ backgroundColor: `hsl(${ui.background})` }}
      >
        {children}
      </main>
      <Footer />
    </div>
  );
}

"use client";

import Footer from "@/components/footer";
import Header from "@/components/header";
import { getTenantUI } from "@/lib/tenant-ui";
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);
  const menuIndex = parts.indexOf("menu");
  const tenantId = menuIndex >= 0 ? parts[menuIndex + 1] : null;
  const ui = getTenantUI(tenantId);

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

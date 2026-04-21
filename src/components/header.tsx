"use client";

import Link from "next/link";
import { useRestaurantSettings } from "@/hooks/use-restaurant-settings";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useParams } from "next/navigation";

export default function Header() {
  const settings = useRestaurantSettings();
  const params = useParams();
  const tenantId = params?.tenantId as string;

  const showLogo = settings?.showLogo ?? true;
  const showName = settings?.showName ?? true;

  return (
    <header className="sticky top-0 z-40 border-b bg-[hsl(var(--nav-bg))] text-[hsl(var(--nav-text))]">
      <div className="relative container mx-auto flex h-20 items-center px-4 md:px-6">
        <Link
          href={tenantId ? `/menu/${tenantId}` : "/"}
          className="
            absolute left-1/2 -translate-x-1/2
            flex items-center gap-3
            opacity-90
            transition-transform transition-opacity
            hover:opacity-100 hover:scale-105
          "
        >
          {/* LOGO */}
          {showLogo && (
            <>
              {settings?.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.name || "Logo"}
                  className="h-12 w-auto object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <>
                  <img
                    src="/logorecortado.png"
                    alt="Logo Light"
                    className="h-12 w-auto object-contain dark:hidden"
                  />
                  <img
                    src="/logorecortado_azul.png"
                    alt="Logo Dark"
                    className="hidden h-12 w-auto object-contain dark:block"
                  />
                </>
              )}
            </>
          )}

          {/* NOMBRE */}
          {showName && (
            <span className="font-headline font-bold text-lg md:text-xl tracking-widest uppercase">
              {settings?.name || "Nuestra Carta"}
            </span>
          )}
        </Link>

        <div className="ml-auto flex items-center">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
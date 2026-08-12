"use client";

import { useTenantUI } from "@/hooks/use-tenant-ui";

import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import {
  UtensilsCrossed,
  QrCode,
  Settings,
  LogOut,
  ChevronUp,
  ExternalLink,
  MessageCircle,
  Store,
  Sparkles,
  Palette,
} from "lucide-react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

import { useEffect, useMemo, useState, type CSSProperties } from "react";

import Image from "next/image";

const SUPPORT_WHATSAPP = "5493412172916";

const getTenantIdFromPath = (pathname: string) => {
  const clean = (pathname || "").split("?")[0].replace(/\/+$/, "");
  const parts = clean.split("/").filter(Boolean);

  const adminIdx = parts.indexOf("admin");
  if (adminIdx === -1) return "picana";

  const reserved = new Set([
    "menu",
    "qr",
    "settings",
    "colors",
    "login",
    "import",
    "almuerzo",
  ]);

  const afterAdmin = parts[adminIdx + 1];
  if (afterAdmin && !reserved.has(afterAdmin)) return afterAdmin;

  const last = parts[parts.length - 1];
  if (last && !reserved.has(last) && last !== "admin") return last;

  return "picana";
};

export default function AdminSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();

  const [user, setUser] = useState<User | null>(null);
  const [tenantLogo, setTenantLogo] = useState("");
  const [tenantName, setTenantName] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const tenantId = useMemo(() => getTenantIdFromPath(pathname), [pathname]);
  const ui = useTenantUI(tenantId);

  useEffect(() => {
    const r = document.documentElement;

    // Menú público
    r.style.setProperty("--nav-bg", ui.navBg);
    r.style.setProperty("--nav-text", ui.navText);

    // Admin
    r.style.setProperty("--background", ui.adminBackground);
    r.style.setProperty("--foreground", ui.adminForeground);
    r.style.setProperty(
      "--muted-foreground",
      ui.adminMutedForeground ?? ui.adminForeground
    );

    r.style.setProperty("--accent", ui.adminAccent);
    r.style.setProperty("--accent-foreground", ui.adminCard);
    r.style.setProperty("--primary", ui.adminAccent);
    r.style.setProperty("--primary-foreground", ui.adminCard);

    r.style.setProperty("--card", ui.adminCard);
    r.style.setProperty("--card-foreground", ui.adminCardForeground);

    r.style.setProperty("--sidebar-background", ui.adminSidebarBg);
    r.style.setProperty("--sidebar-foreground", ui.adminSidebarText);
  }, [
    ui.navBg,
    ui.navText,
    ui.adminBackground,
    ui.adminForeground,
    ui.adminMutedForeground,
    ui.adminAccent,
    ui.adminSidebarBg,
    ui.adminSidebarText,
  ]);
  useEffect(() => {
    async function loadTenantLogo() {
      try {
        const snap = await getDoc(
          doc(db, "tenants", tenantId, "settings", "restaurant")
        );

        if (!snap.exists()) {
          setTenantLogo("");
          setTenantName(tenantId);
          return;
        }

        const data: any = snap.data();

        setTenantLogo(data?.logoUrl || "");
        setTenantName(data?.name || tenantId);
      } catch (e) {
        console.error("Error cargando logo del tenant", e);
        setTenantLogo("");
        setTenantName(tenantId);
      }
    }

    loadTenantLogo();
  }, [tenantId]);

  useEffect(() => {
    const isTenantRoute =
      pathname === `/admin/${tenantId}` ||
      pathname.startsWith(`/admin/${tenantId}/`) ||
      pathname === `/admin/menu/${tenantId}`;

    document.title = isTenantRoute
      ? tenantName.trim() || tenantId
      : "Carta Online";
  }, [pathname, tenantId, tenantName]);

  const logoSrc = tenantLogo;

  const navItems = useMemo(
    () =>
      [
        ui.showFriday && {
          href: `/admin/${tenantId}/almuerzo`,
          label: "Almuerzo Ejecutivo",
          icon: Sparkles,
        },
        {
          href: `/admin/${tenantId}/menu`,
          label: "Menú",
          icon: UtensilsCrossed,
        },
        {
          href: `/admin/${tenantId}/qr`,
          label: "QR",
          icon: QrCode,
        },
        {
          href: `/admin/${tenantId}/colors`,
          label: "Colores",
          icon: Palette,
        },
        {
          href: `/admin/${tenantId}/settings`,
          label: "Ajustes",
          icon: Settings,
        },
      ].filter(Boolean) as Array<{
        href: string;
        label: string;
        icon: any;
      }>,
    [tenantId, ui.showFriday]
  );

  const isActiveHref = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  const displayName = user?.displayName || "Admin";
  const email = user?.email || "admin@picana.com";
  const photoURL = user?.photoURL || "";

  const fallback = useMemo(() => {
    const parts = (displayName || "Admin").trim().split(" ");
    const a = (parts[0]?.[0] || "A").toUpperCase();
    const b = (parts[1]?.[0] || "D").toUpperCase();
    return a + b;
  }, [displayName]);

  async function handleLogout() {
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Error cerrando sesión", e);
    } finally {
      const r = document.documentElement;

      r.style.removeProperty("--nav-bg");
      r.style.removeProperty("--nav-text");
      r.style.removeProperty("--accent");

      window.location.href = `/menu/${tenantId}`;
    }
  }

  return (
    <Sidebar
      className="border-r-0"
      style={{
        backgroundColor: `hsl(${ui.navBg})`,
        color: `hsl(${ui.navText})`,
      }}
    >
      <SidebarHeader
        className="py-4"
        style={{
          backgroundColor: `hsl(${ui.navBg})`,
          color: `hsl(${ui.navText})`,
        }}
      >
        <div className="flex items-center justify-center px-2">
          {logoSrc ? (
            <img
              src={logoSrc}
              alt={tenantId}
              decoding="async"
              className="h-auto w-[180px] object-contain"
            />
          ) : null}
        </div>

        <div className="mt-3 flex items-center justify-between px-3">
          <ThemeToggle />
        </div>

        <Separator className="mt-3 bg-black/10" />
      </SidebarHeader>

      <SidebarContent
        className="p-2"
        style={{
          backgroundColor: `hsl(${ui.adminSidebarBg})`,
          color: `hsl(${ui.adminSidebarText})`,
        }}
      >
        <SidebarMenu>
  {navItems.map((item) => (
    <SidebarMenuItem key={item.href}>
      <SidebarMenuButton
        asChild
        isActive={isActiveHref(item.href)}
        tooltip={item.label}
        className="justify-start bg-[var(--sidebar-item-bg)] text-[var(--sidebar-item-text)] transition-colors hover:bg-[var(--sidebar-item-hover-bg)] hover:text-[var(--sidebar-item-hover-text)]"
        style={{
          "--sidebar-item-bg": isActiveHref(item.href)
            ? `hsl(${ui.adminAccent})`
            : "transparent",
          "--sidebar-item-text": isActiveHref(item.href)
            ? `hsl(${ui.adminCard})`
            : `hsl(${ui.adminSidebarText})`,
          "--sidebar-item-hover-bg": `hsl(${ui.adminAccent})`,
          "--sidebar-item-hover-text": `hsl(${ui.adminCard})`,
        } as CSSProperties}
      >
                <Link href={item.href}>
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter
        className="text-[hsl(var(--nav-text))]"
        style={{ backgroundColor: `hsl(${ui.navBg})` }}
      >
        {state === "expanded" && (
          <div className="relative -left-2 mx-auto inline-flex bg-transparent p-0">
            <Image
              src="/carta-online-logo.png"
              alt="Carta Online"
              width={110}
              height={62}
              className="h-9 w-auto object-contain"
            />
          </div>
        )}

        <Separator className="my-2 bg-white/10" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex h-auto w-full items-center justify-between p-2 text-[hsl(var(--nav-text))] hover:brightness-75 hover:text-white"
            >
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={photoURL} alt={displayName} />
                  <AvatarFallback>{fallback}</AvatarFallback>
                </Avatar>

                {state === "expanded" && (
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">{displayName}</span>
                    <span className="text-xs ">{email}</span>
                  </div>
                )}
              </div>

              {state === "expanded" && <ChevronUp className="h-4 w-4" />}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="mb-2 w-56 bg-[hsl(var(--account-menu-bg))] text-[hsl(var(--account-menu-text))]"
            style={{
              "--account-menu-bg": ui.adminAccountMenuBg,
              "--account-menu-text": ui.adminAccountMenuText,
              "--account-menu-hover-bg": ui.adminAccent,
              "--account-menu-hover-text": ui.adminCard,
              borderColor: `hsl(${ui.adminAccountMenuText})`,
            } as CSSProperties}
            align="end"
            forceMount
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={photoURL} alt={displayName} />
                  <AvatarFallback>{fallback}</AvatarFallback>
                </Avatar>

                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {displayName}
                  </p>
                  <p className="text-xs leading-none opacity-70">
                    {email}
                  </p>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              asChild
              className="focus:bg-[hsl(var(--account-menu-hover-bg))] focus:text-[hsl(var(--account-menu-hover-text))]"
            >
              <Link href={`/menu/${tenantId}`} target="_blank">
                <ExternalLink className="mr-2 h-4 w-4" />
                <span>Ver mi carta</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem
              asChild
              className="focus:bg-[hsl(var(--account-menu-hover-bg))] focus:text-[hsl(var(--account-menu-hover-text))]"
            >
              <Link href="/select-tenant">
                <Store className="mr-2 h-4 w-4" />
                <span>Local: {tenantName || tenantId}</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem
              asChild
              className="focus:bg-[hsl(var(--account-menu-hover-bg))] focus:text-[hsl(var(--account-menu-hover-text))]"
            >
              <a
                href={`https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(
                  `Hola, necesito ayuda con Carta Online. Local: ${tenantName || tenantId}. Usuario: ${email}.`
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                <span>Soporte</span>
              </a>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleLogout}
              className="focus:bg-[hsl(var(--account-menu-hover-bg))] focus:text-[hsl(var(--account-menu-hover-text))]"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

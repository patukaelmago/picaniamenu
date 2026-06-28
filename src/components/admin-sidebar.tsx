"use client";

import { getTenantUI } from "@/lib/tenant-ui";

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
  User as UserIcon,
  Sparkles,
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

import { useEffect, useMemo, useState } from "react";

import Image from "next/image";

const getTenantIdFromPath = (pathname: string) => {
  const clean = (pathname || "").split("?")[0].replace(/\/+$/, "");
  const parts = clean.split("/").filter(Boolean);

  const adminIdx = parts.indexOf("admin");
  if (adminIdx === -1) return "picana";

  const reserved = new Set([
    "menu",
    "qr",
    "settings",
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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const tenantId = useMemo(() => getTenantIdFromPath(pathname), [pathname]);
  const ui = useMemo(() => getTenantUI(tenantId), [tenantId]);

  useEffect(() => {
    const r = document.documentElement;
  
    r.style.setProperty("--nav-bg", ui.navBg);
    r.style.setProperty("--nav-text", ui.navText);
  
    r.style.setProperty("--background", ui.background);
    r.style.setProperty("--foreground", ui.foreground);
  
    r.style.setProperty("--accent", ui.accent);
  
    r.style.setProperty("--card", ui.background);
    r.style.setProperty("--card-foreground", ui.foreground);
  
    r.style.setProperty("--sidebar-background", ui.navBg);
    r.style.setProperty("--sidebar-foreground", ui.navText);
  }, [
    ui.navBg,
    ui.navText,
    ui.background,
    ui.foreground,
    ui.accent,
  ]);
  useEffect(() => {
    async function loadTenantLogo() {
      try {
        const snap = await getDoc(
          doc(db, "tenants", tenantId, "settings", "restaurant")
        );

        if (!snap.exists()) {
          setTenantLogo("");
          return;
        }

        const data: any = snap.data();

        setTenantLogo(data?.logoUrl || "");
      } catch (e) {
        console.error("Error cargando logo del tenant", e);
        setTenantLogo("");
      }
    }

    loadTenantLogo();
  }, [tenantId]);

  const logoSrc = tenantLogo;

  const navItems = useMemo(
    () =>
      [
        ui.showFriday && {
          href: `/admin/${tenantId}/almuerzo`,
          label: "Almuerzo Viernes",
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
            <Image
              src={logoSrc}
              alt={tenantId}
              width={180}
              height={60}
              priority
              className="h-auto w-[180px] object-contain"
            />
          ) : null}
        </div>
  
        <div className="mt-3 flex items-center justify-between px-3">
          <ThemeToggle />
        </div>
  
        <Separator className="mt-3 bg-white/10" />
      </SidebarHeader>
  
      <SidebarContent
        className="p-2 text-[hsl(var(--nav-text))]"
        style={{ backgroundColor: `hsl(${ui.navBg})` }}
      >
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={isActiveHref(item.href)}
                tooltip={item.label}
                className="justify-start text-[hsl(var(--nav-text))] hover:bg-[#fff7e3] hover:text-[#1d2f59] data-[active=true]:bg-[#fff7e3] data-[active=true]:text-[#1d2f59]"
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
        <Separator className="my-2 bg-white/10" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex h-auto w-full items-center justify-between p-2 text-[hsl(var(--nav-text))] hover:bg-white/10 hover:text-white"
            >
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={photoURL} alt={displayName} />
                  <AvatarFallback>{fallback}</AvatarFallback>
                </Avatar>

                {state === "expanded" && (
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">{displayName}</span>
                    <span className="text-xs text-[hsl(var(--nav-text))]/70">{email}</span>
                  </div>
                )}
              </div>

              {state === "expanded" && <ChevronUp className="h-4 w-4" />}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="mb-2 w-56" align="end" forceMount>
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
                  <p className="text-xs leading-none text-muted-foreground">
                    {email}
                  </p>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem>
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link href={`/admin/${tenantId}/settings`}>
                <div className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Ajustes</span>
                </div>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Salir</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
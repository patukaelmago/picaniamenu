"use client";

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

import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useEffect, useMemo, useState } from "react";

import { useTheme } from "next-themes";
import Image from "next/image";

export default function AdminSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();

  // ✅ user real de Google
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  // ✅ logo por tema
  const { resolvedTheme } = useTheme();
  const logoSrc =
    resolvedTheme === "dark" ? "/logorecortado.png" : "/logorecortado_azul.png";

  const navItems = [
    { href: "/admin", label: "Almuerzo Viernes", icon: Sparkles },
    { href: "/admin/menu", label: "Menú", icon: UtensilsCrossed },
    { href: "/admin/qr", label: "QR", icon: QrCode },
    { href: "/admin/settings", label: "Ajustes", icon: Settings },
  ];

  const isActiveHref = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const displayName = user?.displayName || "Admin";
  const email = user?.email || "admin@picaña.com";
  const photoURL = user?.photoURL || "";

  const fallback = useMemo(() => {
    const parts = (displayName || "Admin").trim().split(" ");
    const a = (parts[0]?.[0] || "A").toUpperCase();
    const b = (parts[1]?.[0] || "D").toUpperCase();
    return a + b;
  }, [displayName]);

  return (
    <Sidebar>
      <SidebarHeader className="py-4">
        {/* ✅ LOGO centrado (sin texto) */}
        <div className="flex items-center justify-center px-2">
          <Image
            src={logoSrc}
            alt="Picaña"
            width={180}
            height={60}
            priority
            className="h-auto w-[180px] object-contain"
          />
        </div>

        {/* ✅ Tema + toggle alineados, con el toggle del color del logo */}
        <div className="mt-3 flex items-center justify-between px-3">
          <span className="text-sm text-muted-foreground">Tema</span>
          <ThemeToggle />
        </div>

        <Separator className="mt-3" />
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={isActiveHref(item.href)}
                tooltip={item.label}
                className="justify-start"
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

      {/* ✅ Perfil real de Google abajo */}
      <SidebarFooter>
        <Separator className="my-2" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex h-auto w-full items-center justify-between p-2"
            >
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={photoURL} alt={displayName} />
                  <AvatarFallback>{fallback}</AvatarFallback>
                </Avatar>

                {state === "expanded" && (
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">{displayName}</span>
                    <span className="text-xs text-muted-foreground">{email}</span>
                  </div>
                )}
              </div>

              {state === "expanded" && <ChevronUp className="h-4 w-4" />}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-56 mb-2" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={photoURL} alt={displayName} />
                  <AvatarFallback>{fallback}</AvatarFallback>
                </Avatar>

                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground">{email}</p>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem>
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>

            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Ajustes</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link href="/menu">
                <div className="flex items-center">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </div>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}


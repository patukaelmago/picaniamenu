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
import { useRestaurantSettings } from "@/hooks/use-restaurant-settings";

// ✅ Firebase auth user
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useEffect, useState } from "react";

export default function AdminSidebar() {
  const settings = useRestaurantSettings();
  const restaurantName = settings?.name || "Picaña";
  const pathname = usePathname();
  const { state } = useSidebar();

  // ✅ user real de Google (para el footer)
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

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
  const email = user?.email || `admin@${restaurantName}.com`;
  const photoURL = user?.photoURL || "";

  const fallback =
    (displayName?.trim()?.[0] || "A").toUpperCase() +
    (displayName?.trim()?.split(" ")?.[1]?.[0] || "D").toUpperCase();

  return (
    <Sidebar>
      <SidebarHeader>
        {/* ✅ Header: SOLO LOGO + ThemeToggle (sin avatar/nombre) */}
        <div className="flex items-center justify-between gap-3">
          <Link href="/admin" className="flex items-center">
            {/* Light: logo azul | Dark: logo crema */}
            <img
              src="/logorecortado_azul.png"
              alt="Picaña"
              width={150}
              height={40}
              className="block dark:hidden h-10 w-auto"
            />
            <img
              src="/logorecortado.png"
              alt="Picaña"
              width={150}
              height={40}
              className="hidden dark:block h-10 w-auto"
            />
          </Link>

          {/* Tema toggle */}
          <div className="flex items-center">
            <ThemeToggle />
          </div>
        </div>
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

      <SidebarFooter>
        <Separator className="my-2" />

        {/* ✅ Footer: Google photo + name + email */}
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

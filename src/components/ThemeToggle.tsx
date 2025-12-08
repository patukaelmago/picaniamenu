"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Evita el flash raro entre light/dark en el primer render
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = theme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-full border border-transparent hover:border-border"
      aria-label="Cambiar tema"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {/* Sol (modo claro) */}
      <Sun className={`h-4 w-4 transition-all ${isDark ? "scale-0 opacity-0" : "scale-100 opacity-100"}`} />
      {/* Luna (modo oscuro) */}
      <Moon className={`h-4 w-4 absolute transition-all ${isDark ? "scale-100 opacity-100" : "scale-0 opacity-0"}`} />
    </Button>
  );
}

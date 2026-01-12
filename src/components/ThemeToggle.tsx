"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  // mientras hidrata, mostramos un icono estable
  if (!mounted) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="text-[hsl(var(--nav-text))] hover:bg-transparent hover:text-[hsl(var(--nav-text))]"
        aria-label="Cambiar tema"
      >
        <Sun className="h-5 w-5" />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Cambiar tema"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative",
        "hover:bg-transparent",
        "text-[hsl(var(--nav-text))]",
        "hover:text-[hsl(var(--nav-text))]" // ✅ sin hover (mantiene mismo color)
      )}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}


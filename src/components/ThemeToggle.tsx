"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Evitamos usar resolvedTheme hasta que monte en el cliente
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Mientras no montó, mostramos algo neutro
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="text-[hsl(var(--nav-text))] bg-transparent hover:bg-transparent hover:text-[hsl(var(--nav-text))]"
        aria-label="Cambiar tema"
      >
        <Sun className="h-5 w-5" />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Cambiar tema"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        // 🔴 acá matamos cualquier hover/focus visual del botón
        "relative bg-transparent hover:bg-transparent hover:text-inherit focus-visible:ring-0 focus-visible:ring-offset-0 active:opacity-80 transition-none",
        // color según tema (dorado solo cuando está en oscuro)
        isDark
          ? "text-[#d9b36c]"
          : "text-[hsl(var(--nav-text))]"
      )}
    >
      {/* Sol y luna con la animación */}
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}

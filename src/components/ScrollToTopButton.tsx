"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { usePathname } from "next/navigation";

export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className={`
        fixed bottom-8 right-6
        z-50
        p-3
        rounded-full
        shadow-lg
        hover:scale-110
        transition-all
        ${isHome
          ? "bg-[#2563EB] text-white"
          : "bg-[hsl(var(--nav-bg))] text-[hsl(var(--nav-text))]"}
      `}
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
}
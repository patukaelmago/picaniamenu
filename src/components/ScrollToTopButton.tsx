"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

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
      className="
        fixed bottom-8 right-6
        z-50
        p-3
        rounded-full
        bg-black
        text-white
        shadow-lg
        hover:scale-110
        transition-all
        dark:bg-[hsl(var(--nav-text))]
        dark:text-black
      "
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
}
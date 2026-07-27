"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";

interface ScrollToTopProps {
  className?: string;
  showAfter?: number;
  smooth?: boolean;
}

export function ScrollToTop({
  className,
  showAfter = 300,
  smooth = true,
}: ScrollToTopProps) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > showAfter);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [showAfter]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: smooth ? "smooth" : "instant",
    });
  };

  if (!visible) return null;

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={scrollToTop}
      className={cn(
        "fixed bottom-6 right-6 z-50 h-10 w-10 rounded-full shadow-lg",
        "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
        "hover:bg-gray-100 dark:hover:bg-gray-700",
        "transition-all duration-300",
        className
      )}
      aria-label="Scroll to top"
    >
      <ArrowUp className="h-4 w-4" />
    </Button>
  );
}

interface UseScrollPositionOptions {
  throttle?: number;
}

export function useScrollPosition(options: UseScrollPositionOptions = {}) {
  const { throttle = 100 } = options;
  const [scrollPosition, setScrollPosition] = React.useState({
    x: 0,
    y: 0,
    direction: "up" as "up" | "down",
  });

  React.useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateScrollPosition = () => {
      const currentScrollY = window.scrollY;
      setScrollPosition({
        x: window.scrollX,
        y: currentScrollY,
        direction: currentScrollY > lastScrollY ? "down" : "up",
      });
      lastScrollY = currentScrollY;
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollPosition);
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [throttle]);

  return scrollPosition;
}

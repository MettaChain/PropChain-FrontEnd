"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ThemeSwitcherProps {
  className?: string;
  size?: "sm" | "default" | "icon";
}

export function ThemeSwitcher({
  className,
  size = "sm",
}: ThemeSwitcherProps) {
  const [isMounted, setIsMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  if (!isMounted) {
    const placeholderSize = size === "icon" ? "h-11 w-11" : "h-8 w-20";
    return <div className={cn("shrink-0", placeholderSize, className)} />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="outline"
      size={size}
      onClick={toggleTheme}
      className={cn("gap-2", className)}
      data-testid="theme-switcher"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {size !== "icon" && <span>{isDark ? "Light" : "Dark"}</span>}
    </Button>
  );
}

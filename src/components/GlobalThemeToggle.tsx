"use client";

import { ThemeSwitcher } from "@/components/ThemeSwitcher";

export function GlobalThemeToggle() {
  return (
    <div className="fixed right-4 bottom-20 z-40 md:right-6 md:bottom-6">
      <ThemeSwitcher
        size="icon"
        className="h-11 w-11 rounded-full border-border/70 bg-background/90 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80"
      />
    </div>
  );
}

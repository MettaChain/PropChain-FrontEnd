"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X, ChevronDown, ChevronRight } from "lucide-react";

interface NavItem {
  label: string;
  href?: string;
  children?: NavItem[];
  icon?: React.ReactNode;
}

interface MobileNavigationProps {
  items: NavItem[];
  className?: string;
  trigger?: React.ReactNode;
}

export function MobileNavigation({
  items,
  className,
  trigger,
}: MobileNavigationProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open menu</span>
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="left" className={cn("w-72 p-0", className)}>
        <div className="flex items-center justify-between p-4 border-b">
          <span className="font-semibold text-lg">Menu</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close menu</span>
          </Button>
        </div>
        <nav className="p-4">
          <MobileNavItems items={items} onItemClick={() => setOpen(false)} />
        </nav>
      </SheetContent>
    </Sheet>
  );
}

function MobileNavItems({
  items,
  onItemClick,
  level = 0,
}: {
  items: NavItem[];
  onItemClick: () => void;
  level?: number;
}) {
  return (
    <ul className={cn("space-y-1", level > 0 && "ml-4 mt-1")}>
      {items.map((item) => (
        <MobileNavItem
          key={item.label}
          item={item}
          onItemClick={onItemClick}
          level={level}
        />
      ))}
    </ul>
  );
}

function MobileNavItem({
  item,
  onItemClick,
  level,
}: {
  item: NavItem;
  onItemClick: () => void;
  level: number;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const hasChildren = item.children && item.children.length > 0;

  if (hasChildren) {
    return (
      <li>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <span className="flex items-center gap-2">
            {item.icon}
            {item.label}
          </span>
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        {expanded && item.children && (
          <MobileNavItems
            items={item.children}
            onItemClick={onItemClick}
            level={level + 1}
          />
        )}
      </li>
    );
  }

  return (
    <li>
      <Link
        href={item.href || "#"}
        onClick={onItemClick}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        {item.icon}
        {item.label}
      </Link>
    </li>
  );
}

interface DesktopNavigationProps {
  items: NavItem[];
  className?: string;
}

export function DesktopNavigation({ items, className }: DesktopNavigationProps) {
  return (
    <nav className={cn("hidden md:flex items-center gap-1", className)}>
      {items.map((item) => (
        <DesktopNavItem key={item.label} item={item} />
      ))}
    </nav>
  );
}

function DesktopNavItem({ item }: { item: NavItem }) {
  const [open, setOpen] = React.useState(false);
  const hasChildren = item.children && item.children.length > 0;

  if (hasChildren) {
    return (
      <div
        className="relative"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <button
          className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          {item.icon}
          {item.label}
          <ChevronDown className="h-4 w-4" />
        </button>
        {open && item.children && (
          <div className="absolute top-full left-0 w-48 py-1 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700">
            {item.children.map((child) => (
              <Link
                key={child.label}
                href={child.href || "#"}
                className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {child.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href || "#"}
      className="px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      {item.icon}
      {item.label}
    </Link>
  );
}

interface ResponsiveNavigationProps {
  items: NavItem[];
  className?: string;
}

export function ResponsiveNavigation({ items, className }: ResponsiveNavigationProps) {
  return (
    <div className={cn("flex items-center", className)}>
      <DesktopNavigation items={items} className="flex-1" />
      <MobileNavigation items={items} />
    </div>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  separator?: React.ReactNode;
  className?: string;
  itemClassName?: string;
  activeItemClassName?: string;
}

export function Breadcrumb({
  items: customItems,
  separator = "/",
  className,
  itemClassName,
  activeItemClassName,
}: BreadcrumbProps) {
  const pathname = usePathname();

  const autoItems = React.useMemo(() => {
    if (customItems) return customItems;

    const segments = pathname.split("/").filter(Boolean);
    const generated: BreadcrumbItem[] = [{ label: "Home", href: "/" }];

    let currentPath = "";
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === segments.length - 1;
      generated.push({
        label: formatSegment(segment),
        href: isLast ? undefined : currentPath,
      });
    });

    return generated;
  }, [pathname, customItems]);

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center space-x-2">
        {autoItems.map((item, index) => {
          const isLast = index === autoItems.length - 1;

          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <span className="mx-2 text-gray-400" aria-hidden="true">
                  {separator}
                </span>
              )}
              {isLast || !item.href ? (
                <span
                  className={cn(
                    "text-sm font-medium text-gray-500 dark:text-gray-400",
                    activeItemClassName
                  )}
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors",
                    itemClassName
                  )}
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function formatSegment(segment: string): string {
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

interface BreadcrumbItemProps {
  children: React.ReactNode;
  href?: string;
  active?: boolean;
  className?: string;
}

export function BreadcrumbItem({
  children,
  href,
  active,
  className,
}: BreadcrumbItemProps) {
  return (
    <li className={className}>
      {active || !href ? (
        <span
          className="text-sm font-medium text-gray-500 dark:text-gray-400"
          aria-current="page"
        >
          {children}
        </span>
      ) : (
        <Link
          href={href}
          className="text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
        >
          {children}
        </Link>
      )}
    </li>
  );
}

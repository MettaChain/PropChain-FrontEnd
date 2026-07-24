"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface StickyTableProps extends React.HTMLAttributes<HTMLDivElement> {
  maxHeight?: string;
}

function StickyTable({
  children,
  className,
  maxHeight = "600px",
  ...props
}: StickyTableProps) {
  return (
    <div
      className={cn("relative w-full overflow-auto", className)}
      style={{ maxHeight }}
      {...props}
    >
      {children}
    </div>
  );
}

interface StickyTableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  stickyClassName?: string;
}

function StickyTableHeader({
  className,
  stickyClassName,
  ...props
}: StickyTableHeaderProps) {
  return (
    <thead
      data-slot="sticky-table-header"
      className={cn(
        "sticky top-0 z-10 bg-background",
        stickyClassName,
        className
      )}
      {...props}
    />
  );
}

export { StickyTable, StickyTableHeader };

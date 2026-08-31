"use client";

import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  type DropdownMenuContentProps,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface DropdownItem {
  label: string;
  value?: string;
  icon?: React.ReactNode;
  shortcut?: string;
  disabled?: boolean;
  destructive?: boolean;
  onClick?: () => void;
}

export interface DropdownGroup {
  label?: string;
  items: DropdownItem[];
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items?: DropdownItem[];
  groups?: DropdownGroup[];
  align?: DropdownMenuContentProps["align"];
  side?: DropdownMenuContentProps["side"];
  sideOffset?: number;
  className?: string;
  contentClassName?: string;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
}

export function Dropdown({
  trigger,
  items,
  groups,
  align = "center",
  side = "bottom",
  sideOffset = 4,
  className,
  contentClassName,
  onOpenChange,
  open,
}: DropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleOpenChange = React.useCallback(
    (value: boolean) => {
      setIsOpen(value);
      onOpenChange?.(value);
    },
    [onOpenChange]
  );

  const handleItemClick = React.useCallback(
    (item: DropdownItem, e: Event) => {
      if (item.disabled) {
        e.preventDefault();
        return;
      }
      item.onClick?.();
      setIsOpen(false);
    },
    []
  );

  const renderItem = (item: DropdownItem, index: React.Key) => (
    <DropdownMenuItem
      key={index}
      disabled={item.disabled}
      variant={item.destructive ? "destructive" : "default"}
      onClick={(e) => handleItemClick(item, e.nativeEvent)}
      className="cursor-pointer"
    >
      {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
      <span>{item.label}</span>
      {item.shortcut && (
        <span className="ml-auto text-xs tracking-widest text-muted-foreground">
          {item.shortcut}
        </span>
      )}
    </DropdownMenuItem>
  );

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild className={className}>
        {trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        side={side}
        sideOffset={sideOffset}
        className={cn("min-w-[180px]", contentClassName)}
      >
        {groups
          ? groups.map((group, groupIdx) => (
              <React.Fragment key={groupIdx}>
                {groupIdx > 0 && <DropdownMenuSeparator />}
                {group.label && (
                  <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
                )}
                {group.items.map((item, itemIdx) => renderItem(item, itemIdx))}
              </React.Fragment>
            ))
          : items?.map((item, itemIdx) => renderItem(item, itemIdx))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export type { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem };

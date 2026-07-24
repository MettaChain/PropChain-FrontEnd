"use client";

import * as React from "react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export interface TabItem {
  value: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface ReusableTabsProps {
  items: TabItem[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  orientation?: "horizontal" | "vertical";
  className?: string;
  listClassName?: string;
  triggerClassName?: string;
  contentClassName?: string;
}

export function ReusableTabs({
  items,
  defaultValue,
  value,
  onValueChange,
  orientation = "horizontal",
  className,
  listClassName,
  triggerClassName,
  contentClassName,
}: ReusableTabsProps) {
  return (
    <Tabs
      defaultValue={defaultValue || items[0]?.value}
      value={value}
      onValueChange={onValueChange}
      orientation={orientation}
      className={cn(
        orientation === "vertical" && "flex flex-row gap-4",
        className
      )}
    >
      <TabsList
        className={cn(
          orientation === "vertical" && "flex-col h-auto",
          listClassName
        )}
      >
        {items.map((item) => (
          <TabsTrigger
            key={item.value}
            value={item.value}
            disabled={item.disabled}
            className={cn(
              "flex items-center gap-2",
              orientation === "vertical" && "justify-start w-full",
              triggerClassName
            )}
          >
            {item.icon}
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {items.map((item) => (
        <TabsContent
          key={item.value}
          value={item.value}
          className={contentClassName}
        >
          {item.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };

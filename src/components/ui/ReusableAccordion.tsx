"use client";

import * as React from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

export interface AccordionEntry {
  value: string;
  title: string;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface ReusableAccordionProps {
  items: AccordionEntry[];
  type?: "single" | "multiple";
  defaultValue?: string[];
  value?: string[];
  onValueChange?: (value: string[]) => void;
  className?: string;
  itemClassName?: string;
  triggerClassName?: string;
  contentClassName?: string;
  collapsible?: boolean;
}

export function ReusableAccordion({
  items,
  type = "single",
  defaultValue,
  value,
  onValueChange,
  className,
  itemClassName,
  triggerClassName,
  contentClassName,
  collapsible = true,
}: ReusableAccordionProps) {
  return (
    <Accordion
      type={type}
      defaultValue={defaultValue}
      value={value}
      onValueChange={onValueChange}
      collapsible={collapsible}
      className={cn("w-full", className)}
    >
      {items.map((item) => (
        <AccordionItem
          key={item.value}
          value={item.value}
          disabled={item.disabled}
          className={itemClassName}
        >
          <AccordionTrigger className={triggerClassName}>
            {item.title}
          </AccordionTrigger>
          <AccordionContent className={contentClassName}>
            {item.content}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };

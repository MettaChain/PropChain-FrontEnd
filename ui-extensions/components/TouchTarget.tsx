"use client";

import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import styles from "./TouchTarget.module.css";

export interface TouchTargetProps {
  /** A semantic button or link. Put decorative icons inside this element. */
  children: ReactNode;
}

/** Expands a button or link's hit area to at least 44 by 44 CSS pixels. */
export function TouchTarget({ children }: TouchTargetProps) {
  const child = children as ReactElement<{ className?: string; "data-touch-target"?: string }>;
  if (!isValidElement(child)) {
    throw new Error("TouchTarget expects one button or link element.");
  }

  return cloneElement(child, {
    className: [child.props.className, styles.touchTarget].filter(Boolean).join(" "),
    "data-touch-target": "",
  });
}

export default TouchTarget;

"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Issue #1094 — the single PropChain page header.
 *
 * The same header markup was inlined in twenty places across `src/app`: the
 * chrome (`bg-white dark:bg-gray-800 shadow-sm border-b …`), the 7xl container,
 * the `h-16` flex row, and the PC-square-plus-wordmark brand block. Only the
 * contents of the two ends ever differed, so everything that varies is a prop
 * and everything that does not lives here.
 *
 * ## Two behaviours this fixes on the way through
 *
 * **The brand is no longer an `<h1>`.** Most pages rendered `<h1>PropChain</h1>`
 * in the header *and* an `<h1>` for the page title, giving every page two level-1
 * headings and making the real title ambiguous to a screen reader. The brand is
 * a `<span>` here, so each page keeps exactly one `<h1>` — its own.
 *
 * **One banner landmark per page.** A page that rendered its own `<header>` and
 * also mounted a component that rendered one produced two `banner` landmarks.
 * Rendering this component once per route keeps that to one; `as="div"` is
 * available for the rare case where a second header-shaped block is wanted
 * inside a page without claiming the landmark.
 */
export interface AppHeaderProps {
  /**
   * Pin the header to the top of the viewport. Most routes do; the dashboard
   * shell does not, because it scrolls inside its own `<main>`.
   */
  sticky?: boolean;
  /** Back link rendered before the brand. */
  backHref?: string;
  /**
   * Visible label for the back link, hidden below `sm`. When omitted the link
   * still carries an accessible name via `aria-label`.
   */
  backLabel?: string;
  /** Slot before the brand — e.g. the dashboard's mobile sidebar toggle. */
  leading?: ReactNode;
  /** Right-hand slot. `WalletConnector` is the common case. */
  actions?: ReactNode;
  /**
   * Where the brand links to. Pass `null` to render it as plain text, which is
   * the right choice on the home page where the link would point at itself.
   */
  brandHref?: string | null;
  /**
   * Render as a plain `div` instead of `<header>`, so a second header-shaped
   * row inside a page does not create a competing `banner` landmark.
   */
  as?: "header" | "div";
  className?: string;
  /**
   * Override the inner container width. Defaults to `max-w-7xl`, matching most
   * routes; `/alerts` is laid out at `max-w-4xl` and its header must line up
   * with its own body rather than with the wider pages.
   */
  containerClassName?: string;
}

/**
 * The PC square plus the PropChain wordmark.
 *
 * Deliberately not a heading: see the note on {@link AppHeaderProps}.
 */
function Brand() {
  return (
    <span className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600"
      >
        <span className="text-sm font-bold text-white">PC</span>
      </span>
      <span className="text-xl font-bold text-gray-900 dark:text-white">
        PropChain
      </span>
    </span>
  );
}

/**
 * Renders the one PropChain page header.
 *
 * @param props - See {@link AppHeaderProps}.
 * @returns The header row, with `leading`/back-link/brand on the left and
 *          `actions` on the right.
 */
export function AppHeader({
  sticky = false,
  backHref,
  backLabel,
  leading,
  actions,
  brandHref = "/",
  as: Element = "header",
  className,
  containerClassName,
}: AppHeaderProps) {
  return (
    <Element
      className={cn(
        "border-b border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800",
        sticky && "sticky top-0 z-30",
        className,
      )}
    >
      <div
        className={cn(
          "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8",
          containerClassName,
        )}
      >
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {leading}

            {backHref ? (
              <Link
                href={backHref}
                aria-label={backLabel ?? "Go back"}
                className="flex items-center gap-2 text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                {backLabel ? (
                  <span className="hidden sm:inline">{backLabel}</span>
                ) : null}
              </Link>
            ) : null}

            {brandHref ? (
              <Link href={brandHref} className="flex items-center">
                <Brand />
              </Link>
            ) : (
              <Brand />
            )}
          </div>

          {actions ? (
            <div className="flex items-center gap-3">{actions}</div>
          ) : null}
        </div>
      </div>
    </Element>
  );
}

export default AppHeader;

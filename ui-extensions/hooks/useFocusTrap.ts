import { useCallback, useEffect, useRef, type RefObject } from "react";

/**
 * Focus management for modal dialogs (#1367).
 *
 * Follows the roving-tabindex/focus-restoration pattern used by
 * `src/components/ui/dialog.tsx`, but keeps the trap in one reusable hook so
 * extension dialogs do not each re-implement it.
 */

/** Elements that can receive keyboard focus, in DOM order. */
export const FOCUSABLE_SELECTOR = [
  "a[href]",
  "area[href]",
  "button",
  "input",
  "select",
  "textarea",
  "iframe",
  "object",
  "embed",
  "audio[controls]",
  "video[controls]",
  "summary",
  "[contenteditable]:not([contenteditable='false'])",
  "[tabindex]",
].join(",");

function isHidden(element: HTMLElement): boolean {
  // `offsetParent` is unreliable here: jsdom always reports `null` and
  // `position: fixed` elements legitimately have no offset parent, so the
  // hidden checks are attribute/computed-style based instead.
  if (element.hidden) return true;
  if (element.closest("[hidden], [inert], [aria-hidden='true']")) return true;
  const style = typeof window !== "undefined" ? window.getComputedStyle(element) : null;
  return style?.display === "none" || style?.visibility === "hidden";
}

function isDisabled(element: HTMLElement): boolean {
  const control = element as HTMLElement & { disabled?: boolean };
  if (control.disabled === true) return true;
  return element.closest("[disabled], [aria-disabled='true']") !== null;
}

/**
 * Focusable descendants of `container` that are currently visible, enabled and
 * not opted out of sequential focus with `tabindex="-1"`. Evaluated on demand so
 * elements added after mount are picked up.
 */
export function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => element.tabIndex >= 0 && !isHidden(element) && !isDisabled(element),
  );
}

/**
 * Registry of open traps. Only one trap reacts to a keydown event, which is what
 * makes nested modals behave: the inner modal traps focus and the outer one
 * stays inert until the inner modal closes.
 *
 * Resolution is by DOM depth, not mount order. React mounts child effects before
 * parent effects, so a modal rendered inline inside another would otherwise let
 * the outer trap win.
 */
const activeTraps = new Set<HTMLElement>();
const activationOrder: HTMLElement[] = [];

/**
 * The trap that currently owns the keyboard: the deepest active trap containing
 * the focused element, falling back to the most recently activated trap when
 * focus is somewhere else entirely.
 */
function resolveActiveTrap(): HTMLElement | undefined {
  const focused = typeof document === "undefined" ? null : document.activeElement;
  if (focused) {
    let deepest: HTMLElement | undefined;
    for (const trap of activeTraps) {
      if (trap === focused || !trap.contains(focused)) continue;
      if (!deepest || deepest.contains(trap)) deepest = trap;
    }
    if (deepest) return deepest;
  }
  return activationOrder[activationOrder.length - 1];
}

function registerTrap(container: HTMLElement) {
  activeTraps.add(container);
  const existing = activationOrder.indexOf(container);
  if (existing !== -1) activationOrder.splice(existing, 1);
  activationOrder.push(container);
}

function releaseTrap(container: HTMLElement | null) {
  if (!container) return;
  activeTraps.delete(container);
  const index = activationOrder.lastIndexOf(container);
  if (index !== -1) activationOrder.splice(index, 1);
}

export interface UseFocusTrapOptions {
  /** Trap focus only while true. Toggling to false restores the previous focus. */
  active: boolean;
  /** Element to focus on activation. Falls back to the first focusable descendant. */
  initialFocus?: HTMLElement | null;
  /** Return focus to the element that was focused before activation. Defaults to true. */
  restoreFocus?: boolean;
  /** Called when Escape is pressed while this trap is topmost. */
  onEscape?: () => void;
}

export interface UseFocusTrapResult<T extends HTMLElement> {
  /** Attach to the dialog element that should contain focus. */
  ref: RefObject<T | null>;
}

/**
 * Confines Tab / Shift+Tab within the referenced element, moves focus in on
 * activation and restores it to the trigger on close.
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>({
  active,
  initialFocus,
  restoreFocus = true,
  onEscape,
}: UseFocusTrapOptions): UseFocusTrapResult<T> {
  const ref = useRef<T | null>(null);
  const onEscapeRef = useRef(onEscape);
  const initialFocusRef = useRef(initialFocus);

  // Kept in refs so changing the callbacks does not tear down and rebuild the
  // trap (which would fire a spurious focus restore mid-interaction).
  useEffect(() => {
    onEscapeRef.current = onEscape;
    initialFocusRef.current = initialFocus;
  });

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const container = ref.current;
    if (!container || resolveActiveTrap() !== container) return;

    if (event.key === "Escape") {
      onEscapeRef.current?.();
      return;
    }
    if (event.key !== "Tab") return;

    const focusable = getFocusableElements(container);
    if (focusable.length === 0) {
      // Nothing focusable inside: keep focus on the container rather than
      // letting Tab walk out to the page behind the dialog.
      event.preventDefault();
      container.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const current = document.activeElement as HTMLElement | null;
    const inside = current !== null && container.contains(current);

    if (!inside) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
      return;
    }
    if (event.shiftKey && (current === first || current === container)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && current === last) {
      event.preventDefault();
      first.focus();
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    const container = ref.current;
    if (!container) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    registerTrap(container);

    const target =
      initialFocusRef.current ?? getFocusableElements(container)[0] ?? container;
    if (!target.hasAttribute("tabindex") && target === container) {
      // A dialog with no focusable children still needs to be reachable.
      container.setAttribute("tabindex", "-1");
    }
    target.focus();

    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      releaseTrap(container);
      if (
        restoreFocus &&
        previouslyFocused &&
        previouslyFocused.isConnected &&
        typeof previouslyFocused.focus === "function"
      ) {
        previouslyFocused.focus();
      }
    };
  }, [active, handleKeyDown, restoreFocus]);

  return { ref };
}

export default useFocusTrap;

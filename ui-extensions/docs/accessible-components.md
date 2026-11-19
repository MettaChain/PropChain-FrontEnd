# Guide: Writing Accessible Components in ui-extensions

Target: WCAG 2.1 AA. Reference material in the repo: `docs/property-map-accessibility.md` (keyboard model for the map) and the Storybook a11y setup in `.storybook/` (axe runs on every story).

## ARIA roles and attributes

Prefer native elements (`button`, `a`, `label`, `input`, `nav`); add ARIA only where HTML has no equivalent.

- Name every landmark or custom region: `PropertyMapView` is exposed as a named "Property map" region.
- Status messages: `role="status"` (polite) for loading and empty states; the map announces "no locations match the current filters" this way. Use `role="alert"` for errors.
- Icon-only buttons need `aria-label`. `ThemeSwitcher` does this.
- Toggle state: `aria-pressed` (toggle button) or `aria-expanded` + `aria-controls` (disclosure).

## Keyboard navigation

- Every action reachable with `Tab`, activated with `Enter`/`Space`. Use `<button>`, not a clickable `<div>`.
- Keep DOM order equal to visual order; avoid positive `tabIndex`.
- Composite widgets document their keys. The property map: arrow keys pan, `+`/`-` zoom, `Tab` moves between markers, activating a marker opens its popup. Document keys like this in the component's story or doc comment.
- Never trap focus except in modals.

## Focus management

```tsx
import { useEffect, useRef } from "react";

export function Dialog({ open, onClose, title, children }: DialogProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const triggerRef = useRef<Element | null>(null);

  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement; // remember opener
      headingRef.current?.focus(); // move focus in
    } else {
      (triggerRef.current as HTMLElement | null)?.focus(); // restore on close
    }
  }, [open]);

  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="dlg-title"
         onKeyDown={(e) => e.key === "Escape" && onClose()}>
      <h2 id="dlg-title" ref={headingRef} tabIndex={-1}>{title}</h2>
      {children}
    </div>
  );
}
```

Also: show a visible focus indicator (do not remove `outline` without a replacement), and move focus to the first error after a failed form submit.

## Color contrast

- Normal text: at least 4.5:1. Large text (18pt or 14pt bold): 3:1. UI component borders and focus rings: 3:1.
- Do not rely on color alone (add text or an icon for error / success).
- Check both light and dark themes; the `DarkMode` story pattern in the Storybook guide makes this easy.

## Accessible form example

```tsx
export function AmountField({ error }: { error?: string }) {
  return (
    <div>
      <label htmlFor="amount">Token amount</label>
      <input
        id="amount"
        name="amount"
        inputMode="numeric"
        required
        aria-invalid={!!error}
        aria-describedby={error ? "amount-error" : "amount-hint"}
      />
      <p id="amount-hint">Whole tokens only.</p>
      {error && <p id="amount-error" role="alert">{error}</p>}
    </div>
  );
}
```

Every input has a visible `<label>`; hints and errors are linked with `aria-describedby`; validity is exposed with `aria-invalid`.

## Screen reader testing

1. Automated: Storybook runs `@storybook/addon-a11y` (axe-core) on each story (`.storybook/main.ts`). `preview.tsx` sets `a11y.test: "todo"`, so violations are reported, not failing. Narrow rules per story via `parameters.a11y.config.rules`. The repo also has `src/hooks/useAxeAudit.ts`.
2. Manual, before merging any interactive component: VoiceOver (macOS: Cmd+F5) with Safari, or NVDA (Windows) with Firefox/Chrome. Check that: the name, role and state of each control are announced; errors and loading messages are announced; reading order matches visual order; focus is never lost.
3. Keyboard-only pass: unplug the mouse and complete the whole flow.

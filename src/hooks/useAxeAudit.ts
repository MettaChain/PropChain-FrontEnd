'use client';

import { useEffect } from 'react';

/**
 * Runs axe-core accessibility audit in development and logs WCAG 2.1 AA violations.
 * Issue #85: axe-core automated tests.
 */
export function useAxeAudit() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const axe = await import('axe-core');
        const results = await axe.default.run(document.body, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'best-practice'] },
        });
        if (cancelled) return;
        if (results.violations.length === 0) {
          console.info('[axe] ✅ No accessibility violations found.');
          return;
        }
        console.group(`[axe] ⚠️ ${results.violations.length} violation(s)`);
        for (const v of results.violations) {
          console.warn(`[${v.impact?.toUpperCase()}] ${v.id}: ${v.description} — ${v.helpUrl}`);
          for (const node of v.nodes) console.warn('  Element:', node.html);
        }
        console.groupEnd();
      } catch { /* silently ignore */ }
    }, 1000);
    return () => { cancelled = true; clearTimeout(timer); };
  }, []);
}

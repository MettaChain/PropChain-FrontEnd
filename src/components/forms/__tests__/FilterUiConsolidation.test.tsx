import fs from 'node:fs';
import path from 'node:path';
import { render, waitFor } from '@testing-library/react';
import { SearchFilterForm } from '@/components/forms/SearchFilterForm';
import { DEFAULT_FILTERS, type SearchFilters } from '@/types/property';

/**
 * Issue #1092 — one canonical filter UI, one canonical filter state.
 *
 * Filter UI existed three times over:
 *
 *   components/forms/SearchFilterForm   live on /properties and /forms
 *   components/FilterSidebar            same controls, per-key onFilterChange,
 *                                       tested but rendered by no page
 *   components/filters/*                a sidebar referencing ten filter
 *                                       components that were never imported and
 *                                       do not exist; ten TS2304 errors
 *
 * The third could not compile at all. It went unnoticed because a syntax error
 * in `src/middleware.ts` makes `tsc` skip the semantic pass for the whole
 * program, so every type error in the repo is currently masked.
 *
 * `SearchFilterForm` is canonical: it is the one two pages actually render, it
 * validates through `searchFilterSchema`, and it already speaks `SearchFilters`.
 * The other two are gone.
 *
 * These assertions are structural on purpose. They cannot stop someone building
 * a fourth filter UI, but they fail the moment a duplicate module reappears or
 * the canonical form stops emitting the canonical state shape.
 */
const SRC = path.join(process.cwd(), 'src');

function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      sourceFiles(full, acc);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      acc.push(full);
    }
  }
  return acc;
}

describe('filter UI module graph', () => {
  const files = sourceFiles(SRC);

  it('finds source files to scan', () => {
    expect(files.length).toBeGreaterThan(100);
  });

  it('has exactly one filter form module', () => {
    const forms = files.filter((file) =>
      /[\\/]SearchFilterForm\.tsx$/.test(file),
    );

    expect(forms).toHaveLength(1);
  });

  it('has no FilterSidebar module left', () => {
    const sidebars = files.filter((file) =>
      /[\\/]FilterSidebar\.tsx$/.test(file),
    );

    expect(sidebars).toEqual([]);
  });

  it('has no components/filters directory left', () => {
    expect(fs.existsSync(path.join(SRC, 'components', 'filters'))).toBe(false);
  });

  it('has no import of the removed filter modules', () => {
    const offenders = files.filter((file) => {
      if (file.includes('__tests__')) return false;
      const source = fs.readFileSync(file, 'utf8');
      return /from\s+['"][^'"]*(FilterSidebar|components\/filters|filters\/AdvancedFilters|filters\/FilterSection)['"]/.test(
        source,
      );
    });

    expect(offenders).toEqual([]);
  });
});

describe('canonical filter state', () => {
  it('emits exactly the SearchFilters keys and nothing else', async () => {
    const onApplyFilters = jest.fn();

    render(
      <SearchFilterForm
        filters={DEFAULT_FILTERS}
        onApplyFilters={onApplyFilters}
        onClearFilters={jest.fn()}
      />,
    );

    await waitFor(() => expect(onApplyFilters).toHaveBeenCalled());

    const emitted = onApplyFilters.mock.calls.at(-1)?.[0] as SearchFilters;

    // Key-set equality in both directions: a new control that forgets to feed
    // the canonical type, or a canonical field the form silently drops, fails.
    expect(Object.keys(emitted).sort()).toEqual(
      Object.keys(DEFAULT_FILTERS).sort(),
    );
  });

  it('round-trips the default filters unchanged', async () => {
    const onApplyFilters = jest.fn();

    render(
      <SearchFilterForm
        filters={DEFAULT_FILTERS}
        onApplyFilters={onApplyFilters}
        onClearFilters={jest.fn()}
      />,
    );

    await waitFor(() => expect(onApplyFilters).toHaveBeenCalled());

    const emitted = onApplyFilters.mock.calls.at(-1)?.[0] as SearchFilters;

    expect(emitted).toEqual(DEFAULT_FILTERS);
  });
});

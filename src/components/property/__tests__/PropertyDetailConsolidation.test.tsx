import fs from 'node:fs';
import path from 'node:path';
import { render, screen } from '@testing-library/react';
import { PropertyDetailHeaderActions } from '@/components/property/PropertyDetailHeaderActions';

jest.mock('@/components/PriceAlertBell', () => ({
  PriceAlertBell: () => <button type="button">Price alerts</button>,
}));

jest.mock('@/components/WalletConnector', () => ({
  WalletConnector: () => <button type="button">Connect wallet</button>,
}));

/**
 * Issue #1093 — property detail is one server entry plus one client island.
 *
 * Property detail used to render through four modules: the legacy
 * `components/PropertyDetail`, `components/PropertyDetailServer`, and *two*
 * different `PropertyDetailClient` implementations — one keyed by `propertyId`,
 * one by `property` — reached from two different page files. Only one path was
 * ever live; the rest was reachable only from `page-new.tsx`, which Next does
 * not route and which carried hardcoded mock data.
 *
 * The structural assertions below are the part worth keeping. A unit test cannot
 * stop someone re-adding a parallel tree, but it can fail the moment a deleted
 * module is imported again or a second detail client appears.
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

describe('PropertyDetailHeaderActions', () => {
  it('renders the price alert bell and the wallet connector', () => {
    render(<PropertyDetailHeaderActions />);

    expect(
      screen.getByRole('button', { name: 'Price alerts' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Connect wallet' }),
    ).toBeInTheDocument();
  });

  it('takes no props, so it cannot drift from a property shape', () => {
    expect(PropertyDetailHeaderActions.length).toBe(0);
  });
});

describe('property detail module graph', () => {
  const files = sourceFiles(SRC);

  it('finds source files to scan', () => {
    // Guards against the walker silently returning nothing and making the
    // assertions below vacuous.
    expect(files.length).toBeGreaterThan(100);
  });

  it.each([
    'components/PropertyDetail',
    'components/PropertyDetailClient',
    './PropertyDetailClient',
    'PropertyDetailPageClient',
  ])('has no import of the removed module %s', (removed) => {
    const offenders = files.filter((file) => {
      const source = fs.readFileSync(file, 'utf8');
      // Match only import/export specifiers, so prose in a comment is fine.
      const pattern = new RegExp(
        `from\\s+['"][^'"]*${removed.replace(/[./]/g, '\\$&')}['"]`,
      );
      return pattern.test(source) && !file.includes('__tests__');
    });

    expect(offenders).toEqual([]);
  });

  it('keeps exactly one property detail server entry', () => {
    const entries = files.filter((file) =>
      /[\\/]PropertyDetailServer\.tsx$/.test(file),
    );

    expect(entries).toHaveLength(1);
  });

  it('has no module named PropertyDetailClient anywhere', () => {
    const clients = files.filter((file) =>
      /[\\/]PropertyDetailClient\.tsx$/.test(file),
    );

    expect(clients).toEqual([]);
  });
});

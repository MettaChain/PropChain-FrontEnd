'use client';

import * as React from 'react';
import { create } from 'zustand';

export interface PropertyFilters {
  priceMin: number | null;
  priceMax: number | null;
  types: string[];
  location: string;
  yieldMin: number | null;
  yieldMax: number | null;
  chains: string[];
}

const DEFAULT_FILTERS: PropertyFilters = {
  priceMin: null,
  priceMax: null,
  types: [],
  location: '',
  yieldMin: null,
  yieldMax: null,
  chains: [],
};

interface FilterState {
  filters: PropertyFilters;
  setFilter: <K extends keyof PropertyFilters>(key: K, value: PropertyFilters[K]) => void;
  clearFilters: () => void;
}

export const usePropertyFilterStore = create<FilterState>((set) => ({
  filters: DEFAULT_FILTERS,
  setFilter: (key, value) => set((s) => ({ filters: { ...s.filters, [key]: value } })),
  clearFilters: () => set({ filters: DEFAULT_FILTERS }),
}));

const PROPERTY_TYPES = ['Residential', 'Commercial', 'Industrial', 'Land'];
const CHAINS = ['Ethereum', 'Polygon', 'BSC'];

const toNum = (v: string) => (v === '' ? null : Number(v));
const toggle = (list: string[], item: string) =>
  list.includes(item) ? list.filter((i) => i !== item) : [...list, item];

export function countActiveFilters(f: PropertyFilters): number {
  return (
    (f.priceMin !== null || f.priceMax !== null ? 1 : 0) +
    (f.types.length ? 1 : 0) +
    (f.location ? 1 : 0) +
    (f.yieldMin !== null || f.yieldMax !== null ? 1 : 0) +
    (f.chains.length ? 1 : 0)
  );
}

export function PropertyFilterSidebar({ locations = [] }: { locations?: string[] }) {
  const { filters, setFilter, clearFilters } = usePropertyFilterStore();
  const [open, setOpen] = React.useState(false);
  const active = countActiveFilters(filters);
  const input = 'w-full rounded border border-gray-300 px-2 py-1 text-sm';

  return (
    <aside className="w-full md:w-64" aria-label="Property filters">
      <button
        type="button"
        className="flex w-full items-center justify-between md:hidden"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="font-medium">Filters</span>
        {active > 0 && <span className="rounded-full bg-blue-600 px-2 text-xs text-white">{active}</span>}
      </button>

      <div className={`${open ? 'block' : 'hidden'} space-y-5 md:block`}>
        <div className="hidden items-center justify-between md:flex">
          <h2 className="font-medium">Filters</h2>
          {active > 0 && (
            <span className="rounded-full bg-blue-600 px-2 text-xs text-white" aria-label={`${active} active filters`}>
              {active}
            </span>
          )}
        </div>

        <fieldset>
          <legend className="mb-1 text-sm font-medium">Price range</legend>
          <div className="flex gap-2">
            <input className={input} type="number" min={0} placeholder="Min" aria-label="Minimum price"
              value={filters.priceMin ?? ''} onChange={(e) => setFilter('priceMin', toNum(e.target.value))} />
            <input className={input} type="number" min={0} placeholder="Max" aria-label="Maximum price"
              value={filters.priceMax ?? ''} onChange={(e) => setFilter('priceMax', toNum(e.target.value))} />
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-1 text-sm font-medium">Property type</legend>
          {PROPERTY_TYPES.map((t) => (
            <label key={t} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={filters.types.includes(t)}
                onChange={() => setFilter('types', toggle(filters.types, t))} />
              {t}
            </label>
          ))}
        </fieldset>

        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="pfs-location">Location</label>
          <input id="pfs-location" className={input} list="pfs-locations" placeholder="Search location"
            value={filters.location} onChange={(e) => setFilter('location', e.target.value)} />
          <datalist id="pfs-locations">
            {locations.map((l) => <option key={l} value={l} />)}
          </datalist>
        </div>

        <fieldset>
          <legend className="mb-1 text-sm font-medium">Yield (%)</legend>
          <div className="flex gap-2">
            <input className={input} type="number" min={0} step={0.1} placeholder="Min" aria-label="Minimum yield"
              value={filters.yieldMin ?? ''} onChange={(e) => setFilter('yieldMin', toNum(e.target.value))} />
            <input className={input} type="number" min={0} step={0.1} placeholder="Max" aria-label="Maximum yield"
              value={filters.yieldMax ?? ''} onChange={(e) => setFilter('yieldMax', toNum(e.target.value))} />
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-1 text-sm font-medium">Chain</legend>
          <div className="flex flex-wrap gap-2">
            {CHAINS.map((c) => (
              <button key={c} type="button" aria-pressed={filters.chains.includes(c)}
                className={`rounded border px-2 py-1 text-sm ${filters.chains.includes(c) ? 'bg-blue-600 text-white' : ''}`}
                onClick={() => setFilter('chains', toggle(filters.chains, c))}>
                {c}
              </button>
            ))}
          </div>
        </fieldset>

        <button type="button" className="w-full rounded border px-3 py-1 text-sm" onClick={clearFilters}
          disabled={active === 0}>
          Clear all filters
        </button>
      </div>
    </aside>
  );
}

export default PropertyFilterSidebar;

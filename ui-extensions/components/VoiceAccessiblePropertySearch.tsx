"use client";

import { useMemo, useState, type FormEvent } from "react";

export type SearchPropertyType = "Residential" | "Commercial" | "Industrial" | "Mixed-use";

export interface SearchableProperty {
  id: string;
  name: string;
  location: string;
  type: SearchPropertyType;
  description?: string;
}

export interface VoiceAccessiblePropertySearchProps {
  properties: SearchableProperty[];
  errorMessage?: string;
  onSearch?: (query: string, type: SearchPropertyType | "All") => void;
}

const PROPERTY_TYPES: Array<SearchPropertyType | "All"> = ["All", "Residential", "Commercial", "Industrial", "Mixed-use"];

export function VoiceAccessiblePropertySearch({ properties, errorMessage, onSearch }: VoiceAccessiblePropertySearchProps) {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<SearchPropertyType | "All">("All");

  const results = useMemo(() => {
    const normalizedQuery = submittedQuery.trim().toLocaleLowerCase();
    return properties.filter((property) => {
      const matchesType = typeFilter === "All" || property.type === typeFilter;
      const searchableText = `${property.name} ${property.location} ${property.description ?? ""}`.toLocaleLowerCase();
      return matchesType && (!normalizedQuery || searchableText.includes(normalizedQuery));
    });
  }, [properties, submittedQuery, typeFilter]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmittedQuery(query);
    onSearch?.(query.trim(), typeFilter);
  };

  const clearSearch = () => {
    setQuery("");
    setSubmittedQuery("");
    setTypeFilter("All");
    onSearch?.("", "All");
  };

  return (
    <section aria-labelledby="voice-property-search-title" className="w-full rounded-xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white">
      <h2 id="voice-property-search-title" className="text-xl font-semibold">Find a property</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Search by property name, location, or description. You can also choose a property type.</p>

      <form onSubmit={submitSearch} role="search" className="mt-5">
        <label htmlFor="voice-property-query" className="mb-1 block text-sm font-medium">Search properties</label>
        <div className="flex flex-wrap gap-2">
          <input
            id="voice-property-query"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search properties by keyword or location"
            aria-describedby="voice-property-search-hint"
            placeholder="For example, apartments in Lagos"
            className="min-h-11 min-w-0 flex-1 rounded-lg border border-slate-300 px-3 text-base dark:border-slate-600 dark:bg-slate-800"
          />
          <button type="submit" aria-label="Search properties" className="min-h-11 rounded-lg bg-blue-700 px-5 text-sm font-semibold text-white hover:bg-blue-800">Search</button>
        </div>
        <p id="voice-property-search-hint" className="mt-1 text-xs text-slate-500">Press Enter or say "Click Search properties" to search.</p>
      </form>

      <fieldset className="mt-5">
        <legend className="mb-2 text-sm font-medium">Filter by property type</legend>
        <div className="flex flex-wrap gap-2">
          {PROPERTY_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              aria-label={`Filter properties by type: ${type === "All" ? "all types" : type}`}
              aria-pressed={typeFilter === type}
              onClick={() => {
                setTypeFilter(type);
                onSearch?.(submittedQuery.trim(), type);
              }}
              className={`min-h-11 rounded-full border px-4 text-sm font-medium ${typeFilter === type ? "border-blue-700 bg-blue-700 text-white" : "border-slate-300 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"}`}
            >
              {type === "All" ? "All types" : type}
            </button>
          ))}
        </div>
      </fieldset>

      {errorMessage && (
        <div role="alert" className="mt-5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100">
          {errorMessage}
          <p className="mt-1">Check your connection, then search again.</p>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p role="status" aria-live="polite" aria-atomic="true" className="text-sm font-medium">
          {results.length} {results.length === 1 ? "property" : "properties"} found
        </p>
        {(submittedQuery || typeFilter !== "All") && (
          <button type="button" onClick={clearSearch} aria-label="Clear search and all filters" className="min-h-11 rounded-md px-3 text-sm font-medium text-blue-700 underline underline-offset-2 dark:text-blue-300">
            Clear search and filters
          </button>
        )}
      </div>

      {results.length ? (
        <ul aria-label="Property search results" className="mt-3 divide-y divide-slate-200 dark:divide-slate-700">
          {results.map((property) => (
            <li key={property.id} className="py-3">
              <article aria-label={`${property.name}, ${property.type}`}>
                <h3 className="font-medium">{property.name}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">{property.location} - {property.type}</p>
                {property.description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{property.description}</p>}
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 rounded-lg bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">No properties match those search terms. Try another location or choose All types.</p>
      )}
    </section>
  );
}

export default VoiceAccessiblePropertySearch;

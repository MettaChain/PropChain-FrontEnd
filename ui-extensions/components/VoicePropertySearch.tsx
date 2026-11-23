"use client";

import { useId, useMemo, useState } from "react";

export interface VoiceProperty {
  id: string;
  name: string;
  location: string;
  type: string;
}

export interface VoicePropertySearchProps {
  properties: VoiceProperty[];
  dark?: boolean;
}

const FILTER_TYPES = ["All", "Residential", "Commercial", "Land"];

export default function VoicePropertySearch({
  properties,
  dark = false,
}: VoicePropertySearchProps) {
  const inputId = useId();
  const resultsId = useId();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return properties.filter((property) => {
      const matchesQuery =
        !normalizedQuery ||
        property.name.toLowerCase().includes(normalizedQuery) ||
        property.location.toLowerCase().includes(normalizedQuery);
      const matchesFilter = filter === "All" || property.type === filter;
      return matchesQuery && matchesFilter;
    });
  }, [filter, properties, query]);

  const surface = dark
    ? "border-slate-700 bg-slate-950 text-slate-100"
    : "border-slate-200 bg-white text-slate-900";

  return (
    <section aria-label="Voice controlled property search" className={`w-full rounded-xl border p-5 ${surface}`}>
      <label htmlFor={inputId} className="mb-2 block text-sm font-semibold">
        Search properties by name or location
      </label>
      <input
        id={inputId}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        aria-label="Search properties by name or location"
        aria-describedby="voice-search-help"
        aria-invalid={query.length > 100}
        placeholder="Try: Search Miami properties"
        className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-base"
      />
      <p id="voice-search-help" className="mt-2 text-xs text-slate-500">
        Say “Search for” followed by a property name or location.
      </p>

      <fieldset className="mt-4">
        <legend className="mb-2 text-sm font-semibold">Filter property type</legend>
        <div className="flex flex-wrap gap-2">
          {FILTER_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              aria-label={`Filter by ${type === "All" ? "all property types" : type}`}
              aria-pressed={filter === type}
              onClick={() => setFilter(type)}
              className={`min-h-11 min-w-11 rounded-lg border px-4 text-sm font-medium ${
                filter === type ? "border-blue-700 bg-blue-700 text-white" : ""
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </fieldset>

      {query.length > 100 ? (
        <p role="alert" className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900">
          The search phrase is too long. Please use 100 characters or fewer.
        </p>
      ) : (
        <p id={resultsId} role="status" aria-live="polite" className="mt-4 text-sm font-medium">
          {results.length} {results.length === 1 ? "property" : "properties"} found
        </p>
      )}

      <ul aria-labelledby={resultsId} className="mt-3 space-y-2">
        {results.map((property) => (
          <li key={property.id} className="rounded-lg border p-3">
            <p className="font-medium">{property.name}</p>
            <p className="text-sm text-slate-500">{property.location} · {property.type}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

"use client"

import React, { memo, useCallback, useEffect, useId, useMemo, useRef, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useController, useFormContext, useWatch } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { searchFilterSchema, type SearchFilterFormValues } from "@/lib/formSchemas"
import {
  BLOCKCHAIN_LABELS,
  DEFAULT_FILTERS,
  PROPERTY_TYPE_LABELS,
  PROPERTY_STATUSES,
  type SearchFilters,
  type PropertyType,
  type BlockchainNetwork,
} from "@/types/property"
import { useDebounce } from "@/hooks/useDebounce"
import { ErrorBoundary } from "@/components/ui/SimpleErrorBoundary"

interface SearchFilterFormProps {
  filters: SearchFilters
  onApplyFilters: (filters: SearchFilters) => void
  onClearFilters: () => void
}

export const QUERY_DEBOUNCE_MS = 300

type CheckboxGroupFieldName = "propertyTypes" | "blockchains" | "bedrooms" | "bathrooms" | "status"

interface CheckboxOption {
  value: string | number
  label: string
}

// Option lists are module-level so their identity is stable and the memoized
// checkbox groups below never re-render because of a fresh array prop.
const PROPERTY_TYPE_OPTIONS: readonly CheckboxOption[] = (
  Object.keys(PROPERTY_TYPE_LABELS) as PropertyType[]
).map((type) => ({ value: type, label: PROPERTY_TYPE_LABELS[type] }))

const BLOCKCHAIN_OPTIONS: readonly CheckboxOption[] = (
  Object.keys(BLOCKCHAIN_LABELS) as BlockchainNetwork[]
).map((chain) => ({ value: chain, label: BLOCKCHAIN_LABELS[chain] }))

const BEDROOM_OPTIONS: readonly CheckboxOption[] = [1, 2, 3, 4, 5].map((num) => ({
  value: num,
  label: `${num}+`,
}))

const BATHROOM_OPTIONS: readonly CheckboxOption[] = [1, 2, 3, 4].map((num) => ({
  value: num,
  label: `${num}+`,
}))

const STATUS_OPTIONS: readonly CheckboxOption[] = PROPERTY_STATUSES.map((status) => ({
  value: status,
  label: status,
}))

const valueToFilters = (values: SearchFilterFormValues): SearchFilters => ({
  query: values.query || "",
  priceRange: [values.priceMin, values.priceMax],
  propertyTypes: values.propertyTypes,
  blockchains: values.blockchains,
  roiMin: values.roiMin,
  roiMax: values.roiMax,
  location: values.location || "",
  bedrooms: values.bedrooms,
  bathrooms: values.bathrooms,
  squareFeetRange: [values.squareFeetMin, values.squareFeetMax],
  status: values.status,
})

const filtersToFormValues = (filters: SearchFilters): SearchFilterFormValues => ({
  query: filters.query,
  priceMin: filters.priceRange[0],
  priceMax: filters.priceRange[1],
  propertyTypes: filters.propertyTypes,
  blockchains: filters.blockchains,
  roiMin: filters.roiMin,
  roiMax: filters.roiMax,
  location: filters.location,
  bedrooms: filters.bedrooms,
  bathrooms: filters.bathrooms,
  squareFeetMin: filters.squareFeetRange[0],
  squareFeetMax: filters.squareFeetRange[1],
  status: filters.status,
})

const filtersKey = (filters: SearchFilters) => JSON.stringify(filters)

/** Keys that move focus within a checkbox group, mapped to the next index. */
const NAVIGATION_KEYS: Record<string, (index: number, count: number) => number> = {
  ArrowDown: (index, count) => (index + 1) % count,
  ArrowRight: (index, count) => (index + 1) % count,
  ArrowUp: (index, count) => (index - 1 + count) % count,
  ArrowLeft: (index, count) => (index - 1 + count) % count,
  Home: () => 0,
  End: (_index, count) => count - 1,
}

interface CheckboxGroupFieldProps {
  name: CheckboxGroupFieldName
  label: string
  options: readonly CheckboxOption[]
  className?: string
}

/**
 * One multi-select filter rendered as a single tab stop (roving tabindex).
 * Arrow keys move between options, Home/End jump to the ends, Space toggles.
 *
 * It subscribes to its own field via `useController`, so toggling an option
 * re-renders this group only, not the rest of the panel.
 */
const CheckboxGroupField = memo(function CheckboxGroupField({
  name,
  label,
  options,
  className = "grid gap-2",
}: CheckboxGroupFieldProps) {
  const labelId = useId()
  const { control } = useFormContext<SearchFilterFormValues>()
  const { field } = useController({ control, name })
  const selected = field.value as Array<string | number>
  const [activeIndex, setActiveIndex] = useState(0)
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const move = NAVIGATION_KEYS[event.key]
    if (!move) return
    event.preventDefault()
    const next = move(index, options.length)
    setActiveIndex(next)
    itemRefs.current[next]?.focus()
  }

  return (
    <FormItem>
      <FormLabel id={labelId}>{label}</FormLabel>
      <div role="group" aria-labelledby={labelId} className={className}>
        {options.map((option, index) => (
          <label
            key={option.value}
            className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
          >
            <Checkbox
              ref={(node) => {
                itemRefs.current[index] = node
              }}
              value={String(option.value)}
              tabIndex={index === activeIndex ? 0 : -1}
              checked={selected.includes(option.value)}
              onFocus={() => setActiveIndex(index)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              onCheckedChange={(checked) => {
                const next = checked
                  ? [...selected, option.value]
                  : selected.filter((value) => value !== option.value)
                field.onChange(next)
              }}
            />
            {option.label}
          </label>
        ))}
      </div>
      <FormMessage />
    </FormItem>
  )
})

/**
 * Watches the form and reports changes upward. It renders nothing; keeping the
 * `useWatch` subscription here instead of in the form body means a keystroke
 * re-renders this leaf, not every control in the panel.
 */
function FilterAutoApply({ onApply }: { onApply: (filters: SearchFilters) => void }) {
  const { control } = useFormContext<SearchFilterFormValues>()
  const values = useWatch({ control }) as SearchFilterFormValues
  const debouncedQuery = useDebounce(values.query, QUERY_DEBOUNCE_MS)

  const filters = useMemo(
    () => valueToFilters({ ...values, query: debouncedQuery }),
    [values, debouncedQuery],
  )

  useEffect(() => {
    onApply(filters)
  }, [filters, onApply])

  return null
}

const SearchFilterFormInner = memo(function SearchFilterFormInner({
  filters,
  onApplyFilters,
  onClearFilters,
}: SearchFilterFormProps) {
  const form = useForm<SearchFilterFormValues>({
    resolver: zodResolver(searchFilterSchema),
    defaultValues: filtersToFormValues(filters),
    mode: "onChange",
  })

  // Key of the last filter state sent to (or received from) the parent. Used
  // to drop no-op emits and to ignore the parent echoing our own emit back,
  // which would otherwise reset the form and clobber in-progress typing.
  const lastSyncedKey = useRef<string | null>(null)

  useEffect(() => {
    const key = filtersKey(filters)
    if (key === lastSyncedKey.current) return
    lastSyncedKey.current = key
    form.reset(filtersToFormValues(filters))
  }, [filters, form])

  const handleApply = useCallback(
    (next: SearchFilters) => {
      const key = filtersKey(next)
      if (key === lastSyncedKey.current) return
      lastSyncedKey.current = key
      onApplyFilters(next)
    },
    [onApplyFilters],
  )

  const handleClear = useCallback(() => {
    form.reset(filtersToFormValues(DEFAULT_FILTERS))
    onClearFilters()
  }, [form, onClearFilters])

  const handleQueryKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== "Escape" || !form.getValues("query")) return
      event.preventDefault()
      form.setValue("query", "", { shouldDirty: true, shouldValidate: true })
    },
    [form],
  )

  return (
    <Form {...form}>
      <FilterAutoApply onApply={handleApply} />
      <div role="search" aria-label="Property filters" className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Search Properties</h2>
            <FormItem>
              <FormLabel>Search query</FormLabel>
              <FormControl>
                <Input
                  placeholder="Search properties, locations..."
                  onKeyDown={handleQueryKeyDown}
                  {...form.register("query")}
                />
              </FormControl>
              <FormDescription>
                Type at least 2 characters to narrow down results. Press Escape to clear.
              </FormDescription>
              <FormMessage />
            </FormItem>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormItem>
                <FormLabel>Min price</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step={1000}
                    {...form.register("priceMin", { valueAsNumber: true })}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
              <FormItem>
                <FormLabel>Max price</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step={1000}
                    {...form.register("priceMax", { valueAsNumber: true })}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormItem>
                <FormLabel>Min ROI</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    {...form.register("roiMin", { valueAsNumber: true })}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
              <FormItem>
                <FormLabel>Max ROI</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    {...form.register("roiMax", { valueAsNumber: true })}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </div>

            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="City, state or neighborhood" {...form.register("location")} />
              </FormControl>
              <FormMessage />
            </FormItem>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={handleClear}>
              Clear filters
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Filter settings</h2>

            <CheckboxGroupField name="propertyTypes" label="Property type" options={PROPERTY_TYPE_OPTIONS} />
            <CheckboxGroupField name="blockchains" label="Blockchain" options={BLOCKCHAIN_OPTIONS} />
            <CheckboxGroupField
              name="bedrooms"
              label="Bedrooms"
              options={BEDROOM_OPTIONS}
              className="grid gap-2 sm:grid-cols-3"
            />
            <CheckboxGroupField
              name="bathrooms"
              label="Bathrooms"
              options={BATHROOM_OPTIONS}
              className="grid gap-2 sm:grid-cols-3"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormItem>
                <FormLabel>Min square feet</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step={50}
                    {...form.register("squareFeetMin", { valueAsNumber: true })}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
              <FormItem>
                <FormLabel>Max square feet</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step={50}
                    {...form.register("squareFeetMax", { valueAsNumber: true })}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </div>

            <CheckboxGroupField name="status" label="Status" options={STATUS_OPTIONS} />
          </div>
        </div>
      </div>
    </Form>
  )
})

/**
 * FiltersPanel entry point.
 *
 * The form renders behind an error boundary so a failure in form state or a
 * filter control degrades to a retryable fallback instead of taking down the
 * whole search page.
 *
 * See docs/filters-panel.md for keyboard support and re-render behaviour.
 */
export const SearchFilterForm = memo(function SearchFilterForm(props: SearchFilterFormProps) {
  return (
    <ErrorBoundary>
      <SearchFilterFormInner {...props} />
    </ErrorBoundary>
  )
})

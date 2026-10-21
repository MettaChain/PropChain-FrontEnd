"use client"

import React, { memo, useCallback, useEffect, useId, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFormContext, useWatch } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { searchFilterSchema, type SearchFilterFormValues } from "@/lib/formSchemas"
import {
  DEFAULT_FILTERS,
  PROPERTY_TYPES,
  BLOCKCHAIN_NETWORKS,
  PROPERTY_STATUSES,
  type SearchFilters,
} from "@/types/property"
import { useDebounce } from "@/hooks/useDebounce"
import { ErrorBoundary } from "@/components/ui/SimpleErrorBoundary"

export interface SearchFilterFormProps {
  filters: SearchFilters
  onApplyFilters: (filters: SearchFilters) => void
  onClearFilters: () => void
}

export const QUERY_DEBOUNCE_MS = 300

type FieldsWithValue<Value> = {
  [Name in keyof SearchFilterFormValues]-?: NonNullable<
    SearchFilterFormValues[Name]
  > extends Value
    ? Name
    : never
}[keyof SearchFilterFormValues]

type TextFilterName = FieldsWithValue<string>
type NumberFilterName = FieldsWithValue<number>
type CheckboxGroupFieldName = FieldsWithValue<readonly (string | number)[]>
type CheckboxOptionValue<Name extends CheckboxGroupFieldName> =
  NonNullable<SearchFilterFormValues[Name]> extends readonly (infer Value)[]
    ? Extract<Value, string | number>
    : never

interface CheckboxOption<Value extends string | number> {
  value: Value
  label: string
}

// Option lists are module-level so their identity is stable and the memoized
// checkbox groups below never re-render because of a fresh array prop.
const BEDROOM_OPTIONS: readonly CheckboxOption<number>[] = [1, 2, 3, 4, 5].map((num) => ({
  value: num,
  label: `${num}+`,
}))

const BATHROOM_OPTIONS: readonly CheckboxOption<number>[] = [1, 2, 3, 4].map((num) => ({
  value: num,
  label: `${num}+`,
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

/**
 * Pushes an event onto the GA data layer (Issue #1227).
 *
 * The layer is only created when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set (see
 * `src/lib/analyticsInit.ts`), so this is a no-op when analytics is off, and
 * on the server there is no `window` at all.
 *
 * Only aggregate, non-identifying information is reported: which options are
 * selected and how far each numeric range was narrowed. The search text and
 * the location are left out on purpose — they are free text the user typed.
 */
function trackFiltersChanged(filters: SearchFilters): void {
  if (typeof window === "undefined") return
  window.dataLayer?.push([
    "event",
    "search_filters_changed",
    {
      reset_to_defaults: filtersKey(filters) === filtersKey(DEFAULT_FILTERS),
      property_types: filters.propertyTypes,
      blockchains: filters.blockchains,
      bedrooms: filters.bedrooms,
      bathrooms: filters.bathrooms,
      status: filters.status,
      price_range_narrowed: filters.priceRange[1] < DEFAULT_FILTERS.priceRange[1],
      roi_range_narrowed: filters.roiMax < DEFAULT_FILTERS.roiMax,
    },
  ])
}

/** Keys that move focus within a checkbox group, mapped to the next index. */
const NAVIGATION_KEYS: Partial<Record<string, (index: number, count: number) => number>> = {
  ArrowDown: (index, count) => (index + 1) % count,
  ArrowRight: (index, count) => (index + 1) % count,
  ArrowUp: (index, count) => (index - 1 + count) % count,
  ArrowLeft: (index, count) => (index - 1 + count) % count,
  Home: () => 0,
  End: (_index, count) => count - 1,
}

type CheckboxGroupFieldProps = {
  [Name in CheckboxGroupFieldName]: {
    name: Name
    label: string
    options: readonly CheckboxOption<CheckboxOptionValue<Name>>[]
    className?: string
  }
}[CheckboxGroupFieldName]

/**
 * One multi-select filter rendered as a single tab stop (roving tabindex).
 * Arrow keys move between options, Home/End jump to the ends, Space toggles.
 *
 * It subscribes to its own field via `FormField`, so toggling an option
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
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const selected: readonly (string | number)[] = field.value

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
      }}
    />
  )
})

interface TextFilterFieldProps {
  name: TextFilterName
  label: string
  placeholder?: string
  description?: string
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
}

const TextFilterField = memo(function TextFilterField({
  name,
  label,
  placeholder,
  description,
  onKeyDown,
}: TextFilterFieldProps) {
  const { control } = useFormContext<SearchFilterFormValues>()

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              {...field}
              value={field.value ?? ""}
              placeholder={placeholder}
              onKeyDown={onKeyDown}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
})

interface NumberFilterFieldProps {
  name: NumberFilterName
  label: string
  min: number
  max?: number
  step: number
  dependsOn?: NumberFilterName
}

const NumberFilterField = memo(function NumberFilterField({
  name,
  label,
  min,
  max,
  step,
  dependsOn,
}: NumberFilterFieldProps) {
  const { control } = useFormContext<SearchFilterFormValues>()

  return (
    <FormField
      control={control}
      name={name}
      rules={dependsOn ? { deps: dependsOn } : undefined}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type="number"
              min={min}
              max={max}
              step={step}
              name={field.name}
              ref={field.ref}
              onBlur={field.onBlur}
              value={Number.isNaN(field.value) ? "" : field.value}
              onChange={(event) => {
                field.onChange(event.target.value === "" ? Number.NaN : event.target.valueAsNumber)
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
})

/**
 * Watches the form and reports changes upward. It renders nothing; keeping the
 * `useWatch` subscription here instead of in the form body means a keystroke
 * re-renders this leaf, not every control in the panel.
 */
function FilterAutoApply({ onApply }: { onApply: (filters: SearchFilters) => void }) {
  const { control } = useFormContext<SearchFilterFormValues>()
  const values = useWatch({ control })
  const debouncedQuery = useDebounce(values.query, QUERY_DEBOUNCE_MS)
  const validation = useMemo(
    () => searchFilterSchema.safeParse({ ...values, query: debouncedQuery }),
    [values, debouncedQuery],
  )

  useEffect(() => {
    if (!validation.success) return
    onApply(valueToFilters(validation.data))
  }, [validation, onApply])

  return null
}

const SearchFilterFormInner = memo(function SearchFilterFormInner({
  filters,
  onApplyFilters,
  onClearFilters,
}: SearchFilterFormProps) {
  const { t } = useTranslation("common")
  const propertyTypeOptions = useMemo(
    () => PROPERTY_TYPES.map((type) => ({
      value: type,
      label: t(`filters.propertyTypes.${type}`),
    })),
    [t],
  )
  const blockchainOptions = useMemo(
    () => BLOCKCHAIN_NETWORKS.map((network) => ({
      value: network,
      label: t(`filters.blockchains.${network}`),
    })),
    [t],
  )
  const statusOptions = useMemo(
    () => PROPERTY_STATUSES.map((status) => ({
      value: status,
      label: t(`filters.statuses.${status}`),
    })),
    [t],
  )
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
      // Issue #1227 — the panel applies every change immediately, so this is
      // the one place where an applied filter set is known.
      trackFiltersChanged(next)
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

  // Issue #1228 — the panel looked the same whether or not anything was
  // filtered, and "Clear filters" was clickable even when there was nothing
  // to clear. Both now reflect the empty state: the panel says that nothing
  // has been narrowed down, and clearing is only offered when there is
  // something to clear.
  const hasActiveFilters = filtersKey(filters) !== filtersKey(DEFAULT_FILTERS)

  return (
    <Form {...form}>
      <FilterAutoApply onApply={handleApply} />
      <div role="search" aria-label={t("filters.panelLabel")} className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t("filters.searchProperties")}</h2>
            <TextFilterField
              name="query"
              label={t("filters.searchQuery")}
              placeholder={t("filters.searchPlaceholder")}
              description={t("filters.searchDescription")}
              onKeyDown={handleQueryKeyDown}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <NumberFilterField name="priceMin" label={t("filters.minimumPrice")} min={0} step={1000} />
              <NumberFilterField
                name="priceMax"
                label={t("filters.maximumPrice")}
                min={0}
                step={1000}
                dependsOn="priceMin"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <NumberFilterField name="roiMin" label={t("filters.minimumRoi")} min={0} max={100} step={1} />
              <NumberFilterField
                name="roiMax"
                label={t("filters.maximumRoi")}
                min={0}
                max={100}
                step={1}
                dependsOn="roiMin"
              />
            </div>

            <TextFilterField
              name="location"
              label={t("filters.location")}
              placeholder={t("filters.locationPlaceholder")}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!hasActiveFilters && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("filters.noFiltersApplied")}
              </p>
            )}
            <Button type="button" variant="outline" onClick={handleClear} disabled={!hasActiveFilters}>
              {t("filters.clearFilters")}
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t("filters.filterSettings")}</h2>

            <CheckboxGroupField name="propertyTypes" label={t("filters.propertyType")} options={propertyTypeOptions} />
            <CheckboxGroupField name="blockchains" label={t("filters.blockchain")} options={blockchainOptions} />
            <CheckboxGroupField
              name="bedrooms"
              label={t("filters.bedrooms")}
              options={BEDROOM_OPTIONS}
              className="grid gap-2 sm:grid-cols-3"
            />
            <CheckboxGroupField
              name="bathrooms"
              label={t("filters.bathrooms")}
              options={BATHROOM_OPTIONS}
              className="grid gap-2 sm:grid-cols-3"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <NumberFilterField
                name="squareFeetMin"
                label={t("filters.minimumSquareFeet")}
                min={0}
                step={50}
              />
              <NumberFilterField
                name="squareFeetMax"
                label={t("filters.maximumSquareFeet")}
                min={0}
                step={50}
                dependsOn="squareFeetMin"
              />
            </div>

            <CheckboxGroupField name="status" label={t("filters.status")} options={statusOptions} />
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

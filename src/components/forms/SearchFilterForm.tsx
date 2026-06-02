"use client"

import React, { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller } from "react-hook-form"
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
  PROPERTY_TYPES,
  PROPERTY_STATUSES,
  BLOCKCHAIN_NETWORKS,
  type SearchFilters,
  type PropertyType,
  type BlockchainNetwork,
} from "@/types/property"

interface SearchFilterFormProps {
  filters: SearchFilters
  onApplyFilters: (filters: SearchFilters) => void
  onClearFilters: () => void
}

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

export function SearchFilterForm({ filters, onApplyFilters, onClearFilters }: SearchFilterFormProps) {
  const form = useForm<SearchFilterFormValues>({
    resolver: zodResolver(searchFilterSchema),
    defaultValues: filtersToFormValues(filters),
    mode: "onBlur",
  })

  useEffect(() => {
    form.reset(filtersToFormValues(filters))
  }, [filters])

  const submitHandler = (values: SearchFilterFormValues) => {
    onApplyFilters(valueToFilters(values))
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submitHandler)} className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Search Properties</h2>
            <FormItem>
              <FormLabel>Search query</FormLabel>
              <FormControl>
                <Input
                  placeholder="Search properties, locations..."
                  {...form.register("query")}
                />
              </FormControl>
              <FormDescription>Type at least 2 characters to narrow down results.</FormDescription>
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
            <Button type="submit">Apply filters</Button>
            <Button type="button" variant="outline" onClick={() => {
              form.reset(filtersToFormValues(DEFAULT_FILTERS))
              onClearFilters()
            }}>
              Clear filters
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Filter settings</h2>

            <FormItem>
              <FormLabel>Property type</FormLabel>
              <div className="grid gap-3">
                <Controller
                  name="propertyTypes"
                  control={form.control}
                  render={({ field }) => (
                    <div className="grid gap-2">
                      {(Object.keys(PROPERTY_TYPE_LABELS) as PropertyType[]).map((type) => (
                        <label key={type} className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <Checkbox
                            checked={field.value.includes(type)}
                            onCheckedChange={(checked) => {
                              const next = checked
                                ? [...field.value, type]
                                : field.value.filter((value) => value !== type)
                              field.onChange(next)
                            }}
                          />
                          {PROPERTY_TYPE_LABELS[type]}
                        </label>
                      ))}
                    </div>
                  )}
                />
              </div>
              <FormMessage />
            </FormItem>

            <FormItem>
              <FormLabel>Blockchain</FormLabel>
              <div className="grid gap-2">
                <Controller
                  name="blockchains"
                  control={form.control}
                  render={({ field }) => (
                    <div className="grid gap-2">
                      {(Object.keys(BLOCKCHAIN_LABELS) as BlockchainNetwork[]).map((chain) => (
                        <label key={chain} className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <Checkbox
                            checked={field.value.includes(chain)}
                            onCheckedChange={(checked) => {
                              const next = checked
                                ? [...field.value, chain]
                                : field.value.filter((value) => value !== chain)
                              field.onChange(next)
                            }}
                          />
                          {BLOCKCHAIN_LABELS[chain]}
                        </label>
                      ))}
                    </div>
                  )}
                />
              </div>
              <FormMessage />
            </FormItem>

            <FormItem>
              <FormLabel>Bedrooms</FormLabel>
              <Controller
                name="bedrooms"
                control={form.control}
                render={({ field }) => (
                  <div className="grid gap-2 sm:grid-cols-3">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <label key={num} className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <Checkbox
                          checked={field.value.includes(num)}
                          onCheckedChange={(checked) => {
                            const next = checked
                              ? [...field.value, num]
                              : field.value.filter((value) => value !== num)
                            field.onChange(next)
                          }}
                        />
                        {num}+
                      </label>
                    ))}
                  </div>
                )}
              />
              <FormMessage />
            </FormItem>

            <FormItem>
              <FormLabel>Bathrooms</FormLabel>
              <Controller
                name="bathrooms"
                control={form.control}
                render={({ field }) => (
                  <div className="grid gap-2 sm:grid-cols-3">
                    {[1, 2, 3, 4].map((num) => (
                      <label key={num} className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <Checkbox
                          checked={field.value.includes(num)}
                          onCheckedChange={(checked) => {
                            const next = checked
                              ? [...field.value, num]
                              : field.value.filter((value) => value !== num)
                            field.onChange(next)
                          }}
                        />
                        {num}+
                      </label>
                    ))}
                  </div>
                )}
              />
              <FormMessage />
            </FormItem>

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

            <FormItem>
              <FormLabel>Status</FormLabel>
              <div className="grid gap-2">
                <Controller
                  name="status"
                  control={form.control}
                  render={({ field }) => (
                    <div className="grid gap-2">
                      {PROPERTY_STATUSES.map((status) => (
                        <label key={status} className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <Checkbox
                            checked={field.value.includes(status)}
                            onCheckedChange={(checked) => {
                              const next = checked
                                ? [...field.value, status]
                                : field.value.filter((value) => value !== status)
                              field.onChange(next)
                            }}
                          />
                          {status}
                        </label>
                      ))}
                    </div>
                  )}
                />
              </div>
              <FormMessage />
            </FormItem>
          </div>
        </div>
      </form>
    </Form>
  )
}

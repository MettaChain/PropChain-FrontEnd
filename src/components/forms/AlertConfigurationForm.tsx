"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
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
import { alertConfigurationSchema, type AlertConfigurationFormValues } from "@/lib/formSchemas"
import { PROPERTY_TYPE_LABELS, PROPERTY_TYPES } from "@/types/property"

interface AlertConfigurationFormProps {
  onSubmit: (values: AlertConfigurationFormValues) => void
}

export function AlertConfigurationForm({ onSubmit }: AlertConfigurationFormProps) {
  const form = useForm<AlertConfigurationFormValues>({
    resolver: zodResolver(alertConfigurationSchema),
    defaultValues: {
      alertName: "",
      propertyTypes: [],
      minRoi: 0,
      maxPrice: 0,
      notifyByEmail: true,
      notifyByWallet: false,
      frequency: "instant",
    },
    mode: "onBlur",
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Alert Configuration</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Set rules for price and ROI alerts so you never miss a property opportunity.</p>
        </div>

        <FormItem>
          <FormLabel>Alert name</FormLabel>
          <FormControl>
            <Input {...form.register("alertName")} />
          </FormControl>
          <FormMessage />
        </FormItem>

        <FormItem>
          <FormLabel>Property types</FormLabel>
          <div className="grid gap-2">
            <Controller
              name="propertyTypes"
              control={form.control}
              render={({ field }) => (
                <div className="grid gap-2">
                  {(PROPERTY_TYPES as string[]).map((type) => (
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
                      {PROPERTY_TYPE_LABELS[type as keyof typeof PROPERTY_TYPE_LABELS]}
                    </label>
                  ))}
                </div>
              )}
            />
          </div>
          <FormMessage />
        </FormItem>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormItem>
            <FormLabel>Minimum ROI (%)</FormLabel>
            <FormControl>
              <Input type="number" min={0} max={100} step={1} {...form.register("minRoi", { valueAsNumber: true })} />
            </FormControl>
            <FormMessage />
          </FormItem>
          <FormItem>
            <FormLabel>Maximum price</FormLabel>
            <FormControl>
              <Input type="number" min={0} step={100} {...form.register("maxPrice", { valueAsNumber: true })} />
            </FormControl>
            <FormMessage />
          </FormItem>
        </div>

        <FormItem>
          <FormLabel>Notification channels</FormLabel>
          <div className="grid gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" {...form.register("notifyByEmail")} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              Email notifications
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" {...form.register("notifyByWallet")} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              Wallet push alerts
            </label>
          </div>
          <FormMessage />
        </FormItem>

        <FormItem>
          <FormLabel>Delivery frequency</FormLabel>
          <FormControl>
            <select
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-base outline-none focus-visible:border-ring focus-visible:ring-ring/50"
              {...form.register("frequency")}
            >
              <option value="instant">Instant</option>
              <option value="daily">Daily digest</option>
              <option value="weekly">Weekly summary</option>
            </select>
          </FormControl>
          <FormMessage />
        </FormItem>

        <Button type="submit">Save alert</Button>
      </form>
    </Form>
  )
}

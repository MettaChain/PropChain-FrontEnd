"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
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
import { purchaseTokenSchema, type PurchaseTokenFormValues } from "@/lib/formSchemas"

interface PurchaseTokenFormProps {
  propertyId: string
  propertyName: string
  onSubmit: (values: PurchaseTokenFormValues) => void
}

export function PurchaseTokenForm({ propertyId, propertyName, onSubmit }: PurchaseTokenFormProps) {
  const form = useForm<PurchaseTokenFormValues>({
    resolver: zodResolver(purchaseTokenSchema),
    defaultValues: {
      propertyId,
      tokenAmount: 0,
      maxPricePerToken: 0,
      purchaseType: "market",
      agreeToTerms: false,
    },
    mode: "onSubmit",
  })

  const handleSubmit = (values: PurchaseTokenFormValues) => {
    const result = purchaseTokenSchema.safeParse(values)

    if (!result.success) {
      form.clearErrors()
      result.error.issues.forEach((issue) => {
        const fieldName = issue.path[0]
        if (typeof fieldName === "string") {
          form.setError(fieldName as keyof PurchaseTokenFormValues, {
            type: "validation",
            message: issue.message,
          })
        }
      })
      return
    }

    onSubmit(values)
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        data-tour="purchase-form"
        className="space-y-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900"
      >
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Purchase Tokens</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Purchase tokens for {propertyName} with on-chain validation and an enforced approval step.</p>
        </div>

        <input type="hidden" value={propertyId} {...form.register("propertyId")} />

        <FormField
          control={form.control}
          name="tokenAmount"
          render={({ field }) => {
            const descriptionId = `${field.name}-description`
            const messageId = `${field.name}-message`
            const errorMessage = getFieldError(field.name as keyof PurchaseTokenFormValues)

            return (
              <FormItem>
                <FormLabel>Token amount</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    value={field.value ?? ""}
                    onChange={(event) => {
                      field.onChange(event.target.value === "" ? undefined : Number(event.target.value))
                    }}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    aria-invalid={Boolean(errorMessage)}
                    aria-describedby={[descriptionId, errorMessage ? messageId : undefined].filter(Boolean).join(" ") || undefined}
                  />
                </FormControl>
                <FormDescription id={descriptionId}>Enter the number of property tokens you want to purchase.</FormDescription>
                <FormMessage id={messageId}>{errorMessage}</FormMessage>
              </FormItem>
            )
          }}
        />

        <FormField
          control={form.control}
          name="maxPricePerToken"
          render={({ field }) => {
            const descriptionId = `${field.name}-description`
            const messageId = `${field.name}-message`
            const errorMessage = getFieldError(field.name as keyof PurchaseTokenFormValues)

            return (
              <FormItem>
                <FormLabel>Max price per token</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={field.value ?? ""}
                    onChange={(event) => {
                      field.onChange(event.target.value === "" ? undefined : Number(event.target.value))
                    }}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    aria-invalid={Boolean(errorMessage)}
                    aria-describedby={[descriptionId, errorMessage ? messageId : undefined].filter(Boolean).join(" ") || undefined}
                  />
                </FormControl>
                <FormDescription id={descriptionId}>Limits the price for each token to protect against slippage.</FormDescription>
                <FormMessage id={messageId}>{errorMessage}</FormMessage>
              </FormItem>
            )
          }}
        />

        <FormField
          control={form.control}
          name="purchaseType"
          render={({ field }) => {
            const descriptionId = `${field.name}-description`
            const messageId = `${field.name}-message`
            const errorMessage = getFieldError(field.name as keyof PurchaseTokenFormValues)

            return (
              <FormItem>
                <FormLabel>Purchase type</FormLabel>
                <FormControl>
                  <select
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-base outline-none focus-visible:border-ring focus-visible:ring-ring/50"
                    value={field.value}
                    onChange={(event) => {
                      field.onChange(event)
                    }}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    aria-invalid={Boolean(errorMessage)}
                    aria-describedby={[descriptionId, errorMessage ? messageId : undefined].filter(Boolean).join(" ") || undefined}
                  >
                    <option value="market">Market order</option>
                    <option value="bid">Bid order</option>
                  </select>
                </FormControl>
                <FormDescription id={descriptionId}>Choose whether to buy immediately or submit a bid.</FormDescription>
                <FormMessage id={messageId}>{errorMessage}</FormMessage>
              </FormItem>
            )
          }}
        />

        <FormField
          control={form.control}
          name="agreeToTerms"
          render={({ field, fieldState }) => {
            const messageId = `${field.name}-message`
            const errorMessage = fieldState.error?.message

            return (
              <FormItem>
                <label className="inline-flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={Boolean(field.value)}
                    onChange={(event) => {
                      field.onChange(event.target.checked)
                    }}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    aria-invalid={Boolean(errorMessage)}
                    aria-describedby={errorMessage ? messageId : undefined}
                  />
                  I agree to the terms and conditions for this purchase.
                </label>
                <FormMessage id={messageId}>{errorMessage}</FormMessage>
              </FormItem>
            )
          }}
        />

        <Button type="submit">Submit purchase request</Button>
      </form>
    </Form>
  )
}

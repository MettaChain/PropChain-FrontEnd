"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
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
      tokenAmount: 1,
      maxPricePerToken: 0,
      purchaseType: "market",
      agreeToTerms: false,
    },
    mode: "onBlur",
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        data-tour="purchase-form"
        className="space-y-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900"
      >
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Purchase Tokens</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Purchase tokens for {propertyName} with on-chain validation and an enforced approval step.</p>
        </div>

        <input type="hidden" value={propertyId} {...form.register("propertyId")} />

        <FormItem>
          <FormLabel>Token amount</FormLabel>
          <FormControl>
            <Input
              type="number"
              min={1}
              step={1}
              {...form.register("tokenAmount", { valueAsNumber: true })}
            />
          </FormControl>
          <FormDescription>Enter the number of property tokens you want to purchase.</FormDescription>
          <FormMessage />
        </FormItem>

        <FormItem>
          <FormLabel>Max price per token</FormLabel>
          <FormControl>
            <Input
              type="number"
              min={0}
              step={0.01}
              {...form.register("maxPricePerToken", { valueAsNumber: true })}
            />
          </FormControl>
          <FormDescription>Limits the price for each token to protect against slippage.</FormDescription>
          <FormMessage />
        </FormItem>

        <FormItem>
          <FormLabel>Purchase type</FormLabel>
          <FormControl>
            <select
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-base outline-none focus-visible:border-ring focus-visible:ring-ring/50"
              {...form.register("purchaseType")}
            >
              <option value="market">Market order</option>
              <option value="bid">Bid order</option>
            </select>
          </FormControl>
          <FormDescription>Choose whether to buy immediately or submit a bid.</FormDescription>
          <FormMessage />
        </FormItem>

        <FormItem>
          <label className="inline-flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" {...form.register("agreeToTerms")} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            I agree to the terms and conditions for this purchase.
          </label>
          <FormMessage />
        </FormItem>

        <Button type="submit">Submit purchase request</Button>
      </form>
    </Form>
  )
}

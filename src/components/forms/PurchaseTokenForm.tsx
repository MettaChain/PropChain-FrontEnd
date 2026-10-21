"use client"

import { useEffect, useId, useMemo, useRef, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, type FieldErrors } from "react-hook-form"
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

/**
 * The fields that are listed in the error summary, in the order they appear
 * in the form.
 *
 * `propertyId` is a hidden field, so it has no control to move the focus to
 * and is therefore listed without a link.
 */
const SUMMARY_FIELDS = [
  { name: "propertyId", label: "Property selection", focusable: false },
  { name: "tokenAmount", label: "Token amount", focusable: true },
  { name: "maxPricePerToken", label: "Max price per token", focusable: true },
  { name: "agreeToTerms", label: "Terms and conditions", focusable: true },
] as const satisfies ReadonlyArray<{
  name: keyof PurchaseTokenFormValues
  label: string
  focusable: boolean
}>

/**
 * The investment form of a property.
 *
 * Issue #1268 — the form had no accessible name, did not mark the fields
 * that have to be filled in, and left the user hunting for the reason a
 * submission was refused. The form now:
 *
 * - is named by its heading and described by its introduction, so a screen
 *   reader announces what the form is and which property it is for;
 * - marks the required fields with the `required` attribute;
 * - collects the validation errors in an error summary that receives the
 *   focus when a submission is refused, and links every error to the field
 *   it belongs to.
 */
export function PurchaseTokenForm({ propertyId, propertyName, onSubmit }: PurchaseTokenFormProps) {
  const headingId = useId()
  const introId = useId()
  const errorSummaryRef = useRef<HTMLDivElement>(null)

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

  // The errors of the last refused submission, kept next to the form so they
  // can be listed in the error summary.
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<PurchaseTokenFormValues>>({})
  // Counts the refused submissions. It changes once per refusal, which is
  // what the focus effect below reacts to.
  const [refusedSubmissions, setRefusedSubmissions] = useState(0)

  const errorItems = useMemo(
    () =>
      SUMMARY_FIELDS.map((field) => ({
        ...field,
        message: fieldErrors[field.name]?.message as string | undefined,
      })).filter((item): item is (typeof SUMMARY_FIELDS)[number] & { message: string } =>
        Boolean(item.message)
      ),
    [fieldErrors]
  )

  // Issue #1268 — a refused submission leaves the focus on the submit button,
  // so the user is never told what went wrong. The error summary takes the
  // focus instead, and every entry in it moves the focus to the field it
  // belongs to.
  useEffect(() => {
    if (refusedSubmissions > 0) {
      errorSummaryRef.current?.focus()
    }
  }, [refusedSubmissions])

  const handleInvalid = (errors: FieldErrors<PurchaseTokenFormValues>) => {
    setFieldErrors(errors)
    setRefusedSubmissions((count) => count + 1)
  }

  const handleValid = (values: PurchaseTokenFormValues) => {
    setFieldErrors({})
    onSubmit(values)
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleValid, handleInvalid)}
        noValidate
        data-tour="purchase-form"
        aria-labelledby={headingId}
        aria-describedby={introId}
        className="space-y-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900"
      >
        <div>
          <h2 id={headingId} className="text-xl font-semibold text-gray-900 dark:text-white">
            Purchase Tokens
          </h2>
          <p id={introId} className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Purchase tokens for {propertyName} with on-chain validation and an enforced approval
            step.
          </p>
        </div>

        {errorItems.length > 0 && (
          <div
            ref={errorSummaryRef}
            role="alert"
            tabIndex={-1}
            aria-labelledby={`${headingId}-errors`}
            className="rounded-2xl border border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/40"
          >
            <h3
              id={`${headingId}-errors`}
              className="text-sm font-semibold text-red-900 dark:text-red-200"
            >
              There is a problem
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-900 dark:text-red-200">
              {errorItems.map((item) => (
                <li key={item.name}>
                  {item.focusable ? (
                    <button
                      type="button"
                      onClick={() => form.setFocus(item.name)}
                      className="text-left underline underline-offset-2 hover:no-underline"
                    >
                      {item.label}: {item.message}
                    </button>
                  ) : (
                    <span>
                      {item.label}: {item.message}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <input type="hidden" value={propertyId} {...form.register("propertyId")} />

        <FormField
          control={form.control}
          name="tokenAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Token amount</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  required
                  value={field.value ?? ""}
                  onChange={(event) => {
                    field.onChange(event.target.value === "" ? undefined : Number(event.target.value))
                  }}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              </FormControl>
              <FormDescription>Enter the number of property tokens you want to purchase.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="maxPricePerToken"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max price per token</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  inputMode="decimal"
                  required
                  value={field.value ?? ""}
                  onChange={(event) => {
                    field.onChange(event.target.value === "" ? undefined : Number(event.target.value))
                  }}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              </FormControl>
              <FormDescription>Limits the price for each token to protect against slippage.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="purchaseType"
          render={({ field }) => (
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
                >
                  <option value="market">Market order</option>
                  <option value="bid">Bid order</option>
                </select>
              </FormControl>
              <FormDescription>Choose whether to buy immediately or submit a bid.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="agreeToTerms"
          render={({ field }) => (
            <FormItem>
              <div className="inline-flex items-center gap-3">
                <FormControl>
                  <input
                    type="checkbox"
                    required
                    checked={Boolean(field.value)}
                    onChange={(event) => {
                      field.onChange(event.target.checked)
                    }}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </FormControl>
                <FormLabel className="text-sm text-gray-700 dark:text-gray-300">
                  I agree to the terms and conditions for this purchase.
                </FormLabel>
              </div>
              <FormDescription>
                The purchase is only submitted once the terms have been accepted.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Submit purchase request</Button>
      </form>
    </Form>
  )
}

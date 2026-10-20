"use client"

import React, {
  memo,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export type InvestmentPaymentMethod = "wallet" | "stablecoin" | "bank-transfer"

export const INVESTMENT_PAYMENT_METHODS: ReadonlyArray<{
  value: InvestmentPaymentMethod
  label: string
}> = [
  { value: "wallet", label: "Wallet balance" },
  { value: "stablecoin", label: "USDC" },
  { value: "bank-transfer", label: "Bank transfer" },
]

/** Quick-pick amounts rendered as a radio group under the amount field. */
export const INVESTMENT_PRESETS = [500, 1000, 5000, 10000] as const

export const INVESTMENT_ANALYTICS_EVENTS = {
  view: "investment_form_view",
  amountChanged: "investment_amount_changed",
  submitted: "investment_submitted",
  validationFailed: "investment_validation_failed",
} as const

export type InvestmentAnalyticsEvent =
  (typeof INVESTMENT_ANALYTICS_EVENTS)[keyof typeof INVESTMENT_ANALYTICS_EVENTS]

export interface InvestmentFormValues {
  propertyId: string
  /** Amount invested, in USD. */
  amount: number
  /** Whole/partial property tokens bought at `tokenPrice`. */
  tokenAmount: number
  paymentMethod: InvestmentPaymentMethod
  /** Projected yearly income, in USD. */
  estimatedAnnualIncome: number
}

export interface InvestmentFormProps {
  propertyId: string
  propertyName: string
  /** Price of one property token, in USD. */
  tokenPrice: number
  /** Smallest accepted investment, in USD. Defaults to 100. */
  minInvestment?: number
  /** Largest accepted investment, in USD. Unbounded when omitted. */
  maxInvestment?: number
  /** Projected gross yield used for the income estimate. Defaults to 0. */
  annualYieldPercent?: number
  onSubmit: (values: InvestmentFormValues) => void | Promise<void>
  className?: string
}

interface InvestmentFormErrors {
  amount?: string
  terms?: string
  form?: string
}

type AnalyticsPayload = Record<string, string | number | boolean>

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
})

export function formatCurrency(value: number): string {
  return CURRENCY_FORMATTER.format(Number.isFinite(value) ? value : 0)
}

function formatPreset(preset: number): string {
  return `$${preset.toLocaleString("en-US")}`
}

function formatTokens(value: number): string {
  return Number.isFinite(value)
    ? value.toLocaleString("en-US", { maximumFractionDigits: 4 })
    : "0"
}

function parseAmount(input: string): number | null {
  const normalized = input.trim().replace(/,/g, "")
  if (!normalized) return null
  const value = Number(normalized)
  return Number.isFinite(value) ? value : null
}

/**
 * Analytics only ever receives a band, never the exact figure the investor
 * typed. Property identifiers are public chain data, so they are safe to send.
 */
function amountBucket(amount: number): string {
  if (amount < 1000) return "under_1k"
  if (amount < 5000) return "1k_5k"
  if (amount < 25000) return "5k_25k"
  return "25k_plus"
}

function track(event: InvestmentAnalyticsEvent, payload: AnalyticsPayload): void {
  if (typeof window === "undefined") return
  window.dataLayer?.push(["event", event, payload])
}

function validateInvestment({
  amount,
  minInvestment,
  maxInvestment,
  agreedToTerms,
}: {
  amount: number | null
  minInvestment: number
  maxInvestment?: number
  agreedToTerms: boolean
}): InvestmentFormErrors {
  const errors: InvestmentFormErrors = {}

  if (amount === null) {
    errors.amount = "Enter an investment amount."
  } else if (amount <= 0) {
    errors.amount = "Enter an amount greater than zero."
  } else if (amount < minInvestment) {
    errors.amount = `The minimum investment is ${formatCurrency(minInvestment)}.`
  } else if (maxInvestment !== undefined && amount > maxInvestment) {
    errors.amount = `The maximum investment is ${formatCurrency(maxInvestment)}.`
  }

  if (!agreedToTerms) {
    errors.terms = "Confirm that you have read the investment terms."
  }

  return errors
}

function firstEnabledIndex(minInvestment: number, maxInvestment?: number): number {
  const index = INVESTMENT_PRESETS.findIndex(
    (preset) => preset >= minInvestment && (maxInvestment === undefined || preset <= maxInvestment),
  )
  return index === -1 ? -1 : index
}

interface AmountFieldProps {
  inputId: string
  hintId: string
  errorId: string
  value: string
  error: string | undefined
  minInvestment: number
  maxInvestment: number | undefined
  inputRef: React.RefObject<HTMLInputElement | null>
  onChange: (value: string) => void
  onBlur: (value: string) => void
}

/**
 * Isolated from the rest of the form: only this field re-renders on a
 * keystroke, because the callback props are stable `useCallback` functions.
 */
const AmountField = memo(function AmountField({
  inputId,
  hintId,
  errorId,
  value,
  error,
  minInvestment,
  maxInvestment,
  inputRef,
  onChange,
  onBlur,
}: AmountFieldProps) {
  const describedBy = [hintId, error ? errorId : undefined].filter(Boolean).join(" ")

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>Investment amount</Label>
      <div className="relative">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground"
        >
          $
        </span>
        <Input
          ref={inputRef}
          id={inputId}
          name="investment-amount"
          type="number"
          inputMode="decimal"
          min={minInvestment}
          max={maxInvestment}
          step="0.01"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={(event) => onBlur(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className="pl-7"
        />
      </div>
      <p id={hintId} className="text-sm text-muted-foreground">
        Minimum {formatCurrency(minInvestment)}
        {maxInvestment !== undefined ? ` · maximum ${formatCurrency(maxInvestment)}` : ""}. Amounts are
        invested in USD.
      </p>
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
})

interface PresetGroupProps {
  selectedAmount: number | null
  minInvestment: number
  maxInvestment: number | undefined
  onSelect: (amount: number) => void
}

/**
 * A roving-tabindex radio group: one tab stop for the whole row, arrows move
 * (and select) between presets, Home/End jump to the first/last usable amount.
 */
export const InvestmentPresetGroup = memo(function InvestmentPresetGroup({
  selectedAmount,
  minInvestment,
  maxInvestment,
  onSelect,
}: PresetGroupProps) {
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([])
  const selectedIndex = INVESTMENT_PRESETS.findIndex((preset) => preset === selectedAmount)
  const fallbackIndex = firstEnabledIndex(minInvestment, maxInvestment)
  const tabbableIndex = selectedIndex >= 0 ? selectedIndex : fallbackIndex

  const isEnabled = (index: number): boolean => {
    const preset = INVESTMENT_PRESETS[index]
    return preset >= minInvestment && (maxInvestment === undefined || preset <= maxInvestment)
  }

  const moveSelection = (from: number, step: 1 | -1): number => {
    const count = INVESTMENT_PRESETS.length
    for (let offset = 1; offset <= count; offset += 1) {
      const candidate = (((from + step * offset) % count) + count) % count
      if (isEnabled(candidate)) return candidate
    }
    return -1
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = buttonRefs.current.findIndex((node) => node === document.activeElement)
    const origin = currentIndex === -1 ? tabbableIndex : currentIndex
    let nextIndex: number

    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        nextIndex = moveSelection(origin, 1)
        break
      case "ArrowLeft":
      case "ArrowUp":
        nextIndex = moveSelection(origin, -1)
        break
      case "Home":
        nextIndex = fallbackIndex
        break
      case "End":
        nextIndex = moveSelection(INVESTMENT_PRESETS.length, -1)
        break
      default:
        return
    }

    event.preventDefault()
    if (nextIndex < 0) return
    buttonRefs.current[nextIndex]?.focus()
    onSelect(INVESTMENT_PRESETS[nextIndex])
  }

  return (
    <div
      role="radiogroup"
      aria-label="Quick investment amounts"
      onKeyDown={handleKeyDown}
      className="flex flex-wrap gap-2"
    >
      {INVESTMENT_PRESETS.map((preset, index) => {
        const selected = preset === selectedAmount
        const disabled = !isEnabled(index)
        return (
          <Button
            key={preset}
            ref={(node) => {
              buttonRefs.current[index] = node
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`Invest ${formatPreset(preset)}`}
            tabIndex={index === tabbableIndex ? 0 : -1}
            disabled={disabled}
            variant={selected ? "default" : "outline"}
            size="sm"
            onClick={() => onSelect(preset)}
          >
            {formatPreset(preset)}
          </Button>
        )
      })}
    </div>
  )
})

interface PaymentMethodFieldProps {
  selectId: string
  value: InvestmentPaymentMethod
  onChange: (value: InvestmentPaymentMethod) => void
}

const PaymentMethodField = memo(function PaymentMethodField({
  selectId,
  value,
  onChange,
}: PaymentMethodFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={selectId}>Payment method</Label>
      <select
        id={selectId}
        name="payment-method"
        value={value}
        onChange={(event) => {
          const next = event.target.value
          const match = INVESTMENT_PAYMENT_METHODS.find((option) => option.value === next)
          if (match) onChange(match.value)
        }}
        className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] md:text-sm"
      >
        {INVESTMENT_PAYMENT_METHODS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
})

interface TermsFieldProps {
  checkboxId: string
  errorId: string
  checked: boolean
  error: string | undefined
  onChange: (checked: boolean) => void
}

const TermsField = memo(function TermsField({
  checkboxId,
  errorId,
  checked,
  error,
  onChange,
}: TermsFieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        <input
          id={checkboxId}
          name="investment-terms"
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <Label htmlFor={checkboxId} className="leading-snug">
          I understand that property investments carry risk and I have read the investment terms.
        </Label>
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
})

export interface InvestmentSummaryProps {
  amount: number | null
  tokenAmount: number
  estimatedAnnualIncome: number
  tokenPrice: number
  annualYieldPercent: number
}

/** Live, screen-reader-announced projection of the current amount. */
export const InvestmentSummary = memo(function InvestmentSummary({
  amount,
  tokenAmount,
  estimatedAnnualIncome,
  tokenPrice,
  annualYieldPercent,
}: InvestmentSummaryProps) {
  return (
    <dl
      aria-live="polite"
      aria-atomic="true"
      className="grid gap-4 rounded-2xl border border-border bg-muted/40 p-4 sm:grid-cols-3"
    >
      <div>
        <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tokens</dt>
        <dd className="text-lg font-semibold text-foreground">{formatTokens(tokenAmount)}</dd>
      </div>
      <div>
        <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Estimated annual income
        </dt>
        <dd className="text-lg font-semibold text-foreground">
          {formatCurrency(estimatedAnnualIncome)}
        </dd>
      </div>
      <div>
        <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Price per token
        </dt>
        <dd className="text-lg font-semibold text-foreground">
          {formatCurrency(tokenPrice)}
          {annualYieldPercent > 0 ? (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {annualYieldPercent}% projected yield
            </span>
          ) : null}
        </dd>
      </div>
      <div className="sm:col-span-3">
        <dt className="sr-only">Amount invested</dt>
        <dd className="text-sm text-muted-foreground">
          {amount === null ? "Enter an amount to see your projection." : `Investing ${formatCurrency(amount)}`}
        </dd>
      </div>
    </dl>
  )
})

function InvestmentFormComponent({
  propertyId,
  propertyName,
  tokenPrice,
  minInvestment = 100,
  maxInvestment,
  annualYieldPercent = 0,
  onSubmit,
  className,
}: InvestmentFormProps) {
  const formId = useId()
  const amountId = `${formId}-amount`
  const amountHintId = `${formId}-amount-hint`
  const amountErrorId = `${formId}-amount-error`
  const methodId = `${formId}-method`
  const termsId = `${formId}-terms`
  const termsErrorId = `${formId}-terms-error`

  const [amountInput, setAmountInput] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<InvestmentPaymentMethod>("wallet")
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [errors, setErrors] = useState<InvestmentFormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const amountRef = useRef<HTMLInputElement>(null)

  const amount = useMemo(() => parseAmount(amountInput), [amountInput])

  const tokenAmount = useMemo(() => {
    if (amount === null || amount <= 0 || tokenPrice <= 0) return 0
    return Math.floor((amount / tokenPrice) * 10000) / 10000
  }, [amount, tokenPrice])

  const estimatedAnnualIncome = useMemo(() => {
    if (amount === null || amount <= 0 || annualYieldPercent <= 0) return 0
    return Math.round(((amount * annualYieldPercent) / 100) * 100) / 100
  }, [amount, annualYieldPercent])

  const selectedPreset = useMemo(
    () => (amount !== null && INVESTMENT_PRESETS.some((preset) => preset === amount) ? amount : null),
    [amount],
  )

  useEffect(() => {
    track(INVESTMENT_ANALYTICS_EVENTS.view, {
      property_id: propertyId,
      token_price: tokenPrice,
      annual_yield_percent: annualYieldPercent,
      payment_method_count: INVESTMENT_PAYMENT_METHODS.length,
    })
  }, [propertyId, tokenPrice, annualYieldPercent])

  const handleAmountChange = useCallback((value: string) => {
    setAmountInput(value)
    setErrors((previous) =>
      previous.amount || previous.form ? { ...previous, amount: undefined, form: undefined } : previous,
    )
  }, [])

  const handleAmountBlur = useCallback(
    (value: string) => {
      const parsed = parseAmount(value)
      if (parsed === null || parsed <= 0) return
      // Never send the exact figure: only the band it falls into (issue #1275).
      track(INVESTMENT_ANALYTICS_EVENTS.amountChanged, {
        property_id: propertyId,
        amount_bucket: amountBucket(parsed),
        source: "input",
      })
    },
    [propertyId],
  )

  const handlePresetSelect = useCallback(
    (value: number) => {
      setAmountInput(String(value))
      setErrors((previous) =>
        previous.amount || previous.form ? { ...previous, amount: undefined, form: undefined } : previous,
      )
      track(INVESTMENT_ANALYTICS_EVENTS.amountChanged, {
        property_id: propertyId,
        amount_bucket: amountBucket(value),
        source: "preset",
      })
    },
    [propertyId],
  )

  const handlePaymentMethodChange = useCallback((value: InvestmentPaymentMethod) => {
    setPaymentMethod(value)
  }, [])

  const handleTermsChange = useCallback((checked: boolean) => {
    setAgreedToTerms(checked)
    setErrors((previous) => (previous.terms ? { ...previous, terms: undefined } : previous))
  }, [])

  const handleReset = useCallback(() => {
    setAmountInput("")
    setAgreedToTerms(false)
    setErrors({})
  }, [])

  const handleFormKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault()
      event.currentTarget.requestSubmit()
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) return

    const nextErrors = validateInvestment({
      amount,
      minInvestment,
      maxInvestment,
      agreedToTerms,
    })

    if (nextErrors.amount || nextErrors.terms) {
      setErrors(nextErrors)
      track(INVESTMENT_ANALYTICS_EVENTS.validationFailed, {
        property_id: propertyId,
        fields: (["amount", "terms"] as const).filter((field) => nextErrors[field]).join(","),
      })
      if (nextErrors.amount) amountRef.current?.focus()
      return
    }

    const values: InvestmentFormValues = {
      propertyId,
      amount: amount as number,
      tokenAmount,
      paymentMethod,
      estimatedAnnualIncome,
    }

    track(INVESTMENT_ANALYTICS_EVENTS.submitted, {
      property_id: propertyId,
      amount_bucket: amountBucket(values.amount),
      payment_method: values.paymentMethod,
    })

    setErrors({})
    setIsSubmitting(true)
    try {
      await onSubmit(values)
    } catch {
      setErrors({ form: "We could not submit your investment. Check your connection and try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  const headingId = `${formId}-heading`

  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        "space-y-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900",
        className,
      )}
    >
      <div>
        <h2 id={headingId} className="text-xl font-semibold text-gray-900 dark:text-white">
          Invest in {propertyName}
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Choose how much to invest, review the projected tokens, then confirm the investment.
        </p>
      </div>

      <form
        noValidate
        onSubmit={handleSubmit}
        onKeyDown={handleFormKeyDown}
        aria-busy={isSubmitting}
        className="space-y-6"
      >
        <input type="hidden" name="property-id" value={propertyId} readOnly />

        <div className="space-y-3">
          <AmountField
            inputId={amountId}
            hintId={amountHintId}
            errorId={amountErrorId}
            value={amountInput}
            error={errors.amount}
            minInvestment={minInvestment}
            maxInvestment={maxInvestment}
            inputRef={amountRef}
            onChange={handleAmountChange}
            onBlur={handleAmountBlur}
          />
          <InvestmentPresetGroup
            selectedAmount={selectedPreset}
            minInvestment={minInvestment}
            maxInvestment={maxInvestment}
            onSelect={handlePresetSelect}
          />
        </div>

        <PaymentMethodField
          selectId={methodId}
          value={paymentMethod}
          onChange={handlePaymentMethodChange}
        />

        <InvestmentSummary
          amount={amount}
          tokenAmount={tokenAmount}
          estimatedAnnualIncome={estimatedAnnualIncome}
          tokenPrice={tokenPrice}
          annualYieldPercent={annualYieldPercent}
        />

        <TermsField
          checkboxId={termsId}
          errorId={termsErrorId}
          checked={agreedToTerms}
          error={errors.terms}
          onChange={handleTermsChange}
        />

        {errors.form ? (
          <p role="alert" className="text-sm text-destructive">
            {errors.form}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting…" : "Invest now"}
          </Button>
          <Button type="button" variant="ghost" onClick={handleReset} disabled={isSubmitting}>
            Reset
          </Button>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Press Ctrl/⌘ + Enter to submit. Use the arrow keys to pick a quick amount.
          </p>
        </div>
      </form>
    </section>
  )
}

/**
 * Memoized so a parent re-render with unchanged props does not re-render the
 * form body (issue #1273). Pass stable callbacks to keep this effective.
 */
export const InvestmentForm = memo(InvestmentFormComponent)

# InvestmentForm

`InvestmentForm` (`src/components/forms/InvestmentForm.tsx`) is the reusable property-investment form. It collects an amount, a payment method, and the risk acknowledgement, keeps a live projection of tokens and estimated annual income, and emits a typed payload on submit. It is showcased on `/forms`.

```tsx
<InvestmentForm
  propertyId="property-123"       // required
  propertyName="Oceanview Estate" // required, used in the heading
  tokenPrice={25}                 // USD per token, required
  minInvestment={100}             // default: 100
  maxInvestment={50000}           // optional upper bound
  annualYieldPercent={7.5}        // default: 0 (hides the yield note)
  onSubmit={(values) => saveInvestment(values)} // may return a Promise
/>
```

`onSubmit` receives `InvestmentFormValues`:

```ts
{
  propertyId: string;
  amount: number;              // USD
  tokenAmount: number;         // amount / tokenPrice, floored to 4 decimals
  paymentMethod: 'wallet' | 'stablecoin' | 'bank-transfer';
  estimatedAnnualIncome: number; // amount × annualYieldPercent / 100
}
```

If `onSubmit` rejects, the form keeps the entered values and shows a retryable error; the rejection is not re-thrown.

## Behaviour

- Amounts are validated on submit: a value is required, must be greater than zero, and must sit between `minInvestment` and `maxInvestment`. Errors are announced through `role="alert"` and linked with `aria-describedby`/`aria-invalid`; the amount field receives focus when its value is invalid.
- The risk acknowledgement must be checked before the form submits.
- Correcting the amount or checking the acknowledgement clears the matching error immediately.
- The projection (tokens, estimated annual income, price per token) is announced politely via `aria-live` as the amount changes.
- Quick-amount presets are disabled when they fall outside the configured bounds.

## Keyboard support

| Where | Key | Action |
| --- | --- | --- |
| Quick-amount group | `Tab` / `Shift+Tab` | Enters or leaves the group (one tab stop for the row) |
| Quick-amount group | `ArrowRight` / `ArrowDown` | Selects the next usable preset (wraps) |
| Quick-amount group | `ArrowLeft` / `ArrowUp` | Selects the previous usable preset (wraps) |
| Quick-amount group | `Home` / `End` | Selects the first / last usable preset |
| Amount field | `Enter` | Submits the form |
| Anywhere in the form | `Ctrl+Enter` / `Cmd+Enter` | Submits the form (`requestSubmit`, so validation still runs) |

The quick-amount row is a `role="radiogroup"` with roving `tabindex`: only the selected preset (or the first usable one) is tabbable, and selecting a preset writes its value into the amount field.

## Analytics events (#1275)

Events are pushed onto the GA data layer as `['event', name, payload]`; the layer only exists when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set (see `src/lib/analyticsInit.ts`), so tracking is a no-op otherwise and on the server. Event names are exported as `INVESTMENT_ANALYTICS_EVENTS`.

| Event | When | Payload |
| --- | --- | --- |
| `investment_form_view` | Once per mount | `property_id`, `token_price`, `annual_yield_percent`, `payment_method_count` |
| `investment_amount_changed` | Preset chosen, or amount field blurred with a positive value | `property_id`, `amount_bucket`, `source` (`preset` / `input`) |
| `investment_submitted` | Valid submit, before `onSubmit` resolves | `property_id`, `amount_bucket`, `payment_method` |
| `investment_validation_failed` | Submit blocked by validation | `property_id`, `fields` |

Payloads deliberately contain no PII: exact typed amounts are reduced to bands (`under_1k`, `1k_5k`, `5k_25k`, `25k_plus`), property names are excluded, and no wallet address or payment detail is sent.

## Re-render model (#1273)

- `InvestmentForm` is wrapped in `React.memo`, so a parent re-render with unchanged props skips the whole form.
- `AmountField`, `InvestmentPresetGroup`, `PaymentMethodField`, `TermsField`, and `InvestmentSummary` are memoized leaves. All handlers passed to them are `useCallback` functions, so typing in the amount only re-renders the amount field (plus the parent and live summary), not the preset row, payment select, or terms checkbox.
- Derived values (`amount`, `tokenAmount`, `estimatedAnnualIncome`, `selectedPreset`) are `useMemo` results, and the preset list is a module-level constant so the memoized group never receives a new array.
- The root form element still re-renders when the amount changes because its derived summary and submit state live in the parent.

## Tests (#1272)

- `src/components/forms/__tests__/InvestmentForm.test.tsx`: integration coverage for projection, submission payloads, validation and focus handling, preset keyboard navigation, `Ctrl+Enter`, rejected submissions, analytics payloads, and an axe accessibility check.
- `src/components/forms/__tests__/InvestmentForm.renders.test.tsx`: re-render budget, using a counting button primitive to prove memoized sections skip unrelated updates.
`PurchaseTokenForm` (`src/components/forms/PurchaseTokenForm.tsx`) is the form that
buys property tokens. It is rendered by `/forms` and by the property detail page.

```tsx
<PurchaseTokenForm
  propertyId={property.id}   // the property the tokens are bought for
  propertyName={property.name} // shown in the introduction of the form
  onSubmit={handlePurchase}  // called with the validated values
/>
```

The values are validated with `purchaseTokenSchema` (`src/lib/formSchemas.ts`):

| Field | Rule |
| --- | --- |
| `propertyId` | Not empty |
| `tokenAmount` | A whole number of at least 1 and at most 100,000 |
| `maxPricePerToken` | Greater than zero |
| `purchaseType` | `market` or `bid` |
| `agreeToTerms` | Accepted |

## Accessibility

The form is a `form` landmark named after its heading and described by its
introduction, so a screen reader announces what the form is and which property
it is for before the user enters it.

| What | How |
| --- | --- |
| The name of the form | `aria-labelledby` points at the heading |
| The description of the form | `aria-describedby` points at the introduction |
| The fields that have to be filled in | The `required` attribute on the input |
| The help of a field | `FormDescription`, referenced by `aria-describedby` |
| The reason a value is refused | `FormMessage`, referenced by `aria-describedby` and announced with `role="alert"` |
| The refused values of a submission | The error summary |

### The error summary

A refused submission leaves the focus on the submit button, which leaves the
user hunting for the reason. The form therefore collects the errors of the
refused submission in an error summary above the fields:

- the summary is a `role="alert"` region named "There is a problem";
- it receives the focus when a submission is refused, so the reasons are read
  out;
- every entry in the summary moves the focus to the field it belongs to;
- the summary disappears as soon as the form is submitted successfully.

The hidden `propertyId` field has no control to focus, so it is listed in the
summary without a link.

## Tests

- `src/components/forms/__tests__/PurchaseTokenForm.test.tsx`: the rendering,
  the validation rules and the submission.
- `src/components/forms/__tests__/PurchaseTokenForm.a11y.test.tsx`: the name and
  the description of the form, the required fields, the error summary and the
  focus management.

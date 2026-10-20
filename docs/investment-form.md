# InvestmentForm

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

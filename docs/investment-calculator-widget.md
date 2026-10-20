# InvestmentCalculatorWidget

`InvestmentCalculatorWidget` (`src/components/widget/InvestmentCalculatorWidget.tsx`)
is the investment form of the app. It is rendered on
`/widget/investment-calculator` and embedded in other people's pages through
that route, which serves it in an iframe.

```tsx
<InvestmentCalculatorWidget
  theme={{ primaryColor: '#2563eb', brandName: 'PropChain' }}
  defaultInvestment={1000}
  defaultYield={8}
  ctaUrl="https://propchain.io/properties"
  ctaText="Invest on PropChain"
  propertyId="property-123"
  compact={false}
/>
```

The inputs are the amount invested, the expected annual yield, the holding
period and the expected annual appreciation. The widget projects the rental
income, the capital gains, the return on investment, the break-even point and
the internal rate of return from them.

## Projection

The projection is calculated by `calculateInvestmentProjection`
(`src/lib/investmentProjection.ts`). It is a pure function, so it is unit
tested on its own and memoised in the component.

The inputs come from free-form number fields, so anything can arrive: an empty
field, a zero, a negative number. A projection is only meaningful for a
positive amount invested over a positive holding period, so anything else is
projected as zero. Without that guard the widget rendered `NaN%` and
`Infinity mo` in the metric cards.

## Layout

The widget is embedded in a frame whose width is not known ahead of time: it
can be a 600px column on a desktop and a 320px phone screen on a mobile.

- The container fills the width of the frame (`width: 100%`, `max-width: 600px`,
  `box-sizing: border-box`).
- The paddings and the font sizes scale with the viewport (`clamp()`), so the
  widget shrinks with the frame instead of overflowing it.
- The metrics stay in two columns, but the columns are `minmax(0, 1fr)`, so
  they can shrink below the width of their content. A fixed `1fr` cannot
  shrink, which is what pushed the numbers out of a narrow frame.
- The rows that hold a label and a number wrap, and long numbers break inside
  their own box, so a six-figure total never pushes the layout out of the
  frame.

## Loading state

The embed page used to render an empty box until the client had mounted, which
read as a broken widget rather than a loading one. It now renders
`InvestmentCalculatorSkeleton`, which has the same padding, the same grid and
the same blocks as the widget, so the calculator takes its place without the
frame jumping around. The skeleton is a `role="status"` element, so assistive
technology is told that the calculator is on its way.

## Error handling

The widget is rendered inside somebody else's page, so a failure inside it
would empty the frame and leave the visitor with nothing to look at. The
widget is wrapped in the shared `ErrorBoundary`
(`src/components/ui/SimpleErrorBoundary`) with a fallback that explains what
happened and offers a retry. The retry remounts the boundary, which clears
the error it caught.

## Tests

- `src/lib/__tests__/investmentProjection.test.ts`: the projection, including
  the empty, zero, negative and non-finite inputs.
- `src/components/widget/__tests__/InvestmentCalculatorWidget.test.tsx`: the
  rendered figures, the recalculation, the responsive layout and the skeleton.
- `src/components/widget/__tests__/InvestmentCalculatorWidget.error.test.tsx`:
  a failure inside the widget is caught and turned into the retryable
  fallback.

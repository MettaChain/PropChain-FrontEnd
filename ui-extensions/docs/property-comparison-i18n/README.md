# Property Comparison Translation Keys (issue #1382)

Translation keys for the property comparison interface in all seven supported
languages. The catalog lives entirely in `ui-extensions/docs/` so no files in
`src/`, `public/` or `tests/` are modified.

## Languages

| File | Language | Direction |
|------|----------|-----------|
| `en.json` | English (fallback) | LTR |
| `es.json` | Spanish | LTR |
| `fr.json` | French | LTR |
| `de.json` | German | LTR |
| `zh.json` | Chinese | LTR |
| `ar.json` | Arabic | RTL |
| `he.json` | Hebrew | RTL |

Every file has the same key structure under the `propertyComparison` namespace.
Files use `camelCase` keys and i18next interpolation (`{{count}}`, `{{max}}`),
matching `src/locales/<lng>/common.json`.

## Key groups

- `headers.*` - comparison table headers (property, location, price, ROI,
  yield, details, actions).
- `filters.*` - filter labels, placeholders and actions.
- `empty.*` - empty-selection and no-results states.
- `errors.*` - load failures, invalid ranges, selection limits and retry.
- `tooltips.*` - explanatory text for each metric and control.
- `actions.*` - add / remove / clear / share labels.
- `_direction` - `ltr` or `rtl`, used to set the root element's `dir`.

`title` and `subtitle` are top-level keys for the comparison panel.

## Usage

The keys are intended to be merged into the app's existing `common` namespace
(`src/lib/i18n.ts` already registers one `common` resource per language). Add
the `propertyComparison` object from each file into the matching
`src/locales/<lng>/common.json`, then:

```tsx
import { useTranslation } from 'react-i18next';
import { isRtl, propertyComparisonKey } from '../../ui-extensions/docs/property-comparison-i18n/keys';

const { t, i18n } = useTranslation();
const dir = isRtl(i18n.language) ? 'rtl' : 'ltr';

<th>{t(propertyComparisonKey('headers.roi'))}</th>
<p>{t(propertyComparisonKey('empty.description'))}</p>
```

`keys.ts` exports the language list, the RTL helper and the typed key union so
consumers cannot typo a key.

## RTL notes

Arabic and Hebrew set `_direction` to `rtl`, and their strings are authored in
native script. Components should set `dir` on their root element and prefer
logical Tailwind utilities (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`) so
layouts mirror automatically.

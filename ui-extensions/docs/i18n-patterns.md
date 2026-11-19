# i18n Patterns for Extension Components

This guide explains how components in `ui-extensions/components/` should handle translations. It reflects the existing setup in `src/lib/i18n.ts` and `src/locales/`; extension code reuses it and does not create its own i18n instance.

## 1. Setup

The app uses **i18next** with **react-i18next** (not next-i18next) and `i18next-browser-languagedetector`. `src/lib/i18n.ts`:

- bundles one `common` namespace per language from `src/locales/<lng>/common.json`
- sets `fallbackLng: "en"` and `defaultNS: "common"`
- detects the language from `localStorage`, then `navigator`, then `htmlTag`, and caches the choice in `localStorage`

Supported languages (7): `en`, `es`, `fr`, `de`, `zh`, `ar`, `he`.

## 2. Using translations

```tsx
import { useTranslation } from 'react-i18next';

export function SaveButton() {
  const { t } = useTranslation(); // default namespace: "common"
  return <button>{t('common.save')}</button>;
}
```

Keys are nested under a top-level `common` object in each JSON file (see `src/locales/en/common.json`, e.g. `common.loading`, `common.save`). Never hard-code user-facing strings; accept labels via props or call `t`.

## 3. Locale-specific formatting

Format numbers, currency and dates with the built-in `Intl` APIs using the active language from `i18n`:

```tsx
const { i18n } = useTranslation();
const price = new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'USD' }).format(1250000);
const date = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(new Date());
```

## 4. RTL (Arabic and Hebrew)

`ar` and `he` are right-to-left. Detect it from the active language and set `dir` on the component root:

```tsx
const { i18n } = useTranslation();
const dir = ['ar', 'he'].includes(i18n.language) ? 'rtl' : 'ltr';
return <div dir={dir}>...</div>;
```

Prefer Tailwind logical utilities (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`) over `ml-*`, `mr-*`, `text-left` so layouts flip automatically.

## 5. Adding a new translation key

1. Add the key to `src/locales/en/common.json` under `common` (or the relevant section).
2. Add the same key to every other file: `es`, `fr`, `de`, `zh`, `ar`, `he`.
3. Use it with `t('common.yourKey')`.

If a key is missing in a language, i18next falls back to `en`.

## 6. Example for all 7 languages

Using the existing `common.save` key, the same component renders in each language by changing the active language:

```tsx
import { useTranslation } from 'react-i18next';

const LANGUAGES = ['en', 'es', 'fr', 'de', 'zh', 'ar', 'he'] as const;

export function LanguageDemo() {
  const { t, i18n } = useTranslation();
  return (
    <div dir={['ar', 'he'].includes(i18n.language) ? 'rtl' : 'ltr'}>
      {LANGUAGES.map((lng) => (
        <button key={lng} onClick={() => i18n.changeLanguage(lng)}>
          {lng}
        </button>
      ))}
      <p>{t('common.save')}</p>
    </div>
  );
}
```

Clicking each button re-renders `t('common.save')` from the matching `src/locales/<lng>/common.json`.

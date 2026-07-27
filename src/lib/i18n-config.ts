/**
 * i18n Configuration with Namespace-Level Chunking
 *
 * This configuration enables static site generation (SSG) for
 * internationalized content with namespace-level code splitting.
 *
 * Each namespace (common, navigation, wallet, etc.) is loaded as
 * a separate chunk, reducing initial bundle size.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Supported languages
export const locales = ['en', 'ar', 'de', 'es', 'fr', 'he', 'zh'] as const;
export type Locale = (typeof locales)[number];

// Default locale
export const defaultLocale: Locale = 'en';

// Namespace definitions for code splitting
export const namespaces = [
  'common',
  'navigation',
  'wallet',
  'properties',
  'transactions',
  'governance',
  'tax',
  'errors',
  'accessibility',
  'referral',
] as const;
export type Namespace = (typeof namespaces)[number];

// Dynamic namespace loader for code splitting
const loadNamespaceBundle = async (locale: string, namespace: string) => {
  try {
    const response = await import(`@/locales/${locale}/${namespace}.json`);
    return response.default;
  } catch {
    // Fallback to English if translation not found
    const fallback = await import(`@/locales/en/${namespace}.json`);
    return fallback.default;
  }
};

// Initialize i18next
i18n.use(initReactI18next).init({
  resources: {},
  lng: defaultLocale,
  fallbackLng: defaultLocale,
  ns: [...namespaces],
  defaultNS: 'common',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: true,
  },
});

// Preload function for SSG
export const preloadNamespaces = async (locale: Locale, nsList: Namespace[]) => {
  const promises = nsList.map(async (ns) => {
    const bundle = await loadNamespaceBundle(locale, ns);
    i18n.addResourceBundle(locale, ns, bundle, true, true);
  });
  await Promise.all(promises);
};

// Load all namespaces for a locale (used in SSG)
export const loadLocaleNamespaces = async (locale: Locale) => {
  await preloadNamespaces(locale, [...namespaces]);
};

// Get static paths for SSG
export const getStaticPaths = () => {
  return {
    paths: locales.map((locale) => ({ params: { locale } })),
    fallback: false,
  };
};

export default i18n;

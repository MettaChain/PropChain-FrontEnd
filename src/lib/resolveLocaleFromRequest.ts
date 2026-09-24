const SUPPORTED_LOCALES = ['en', 'es', 'fr', 'de', 'zh', 'ar', 'he'];
const RTL_LOCALES = new Set(['ar', 'he']);
const LOCALE_COOKIE_NAME = 'NEXT_LOCALE';

export interface ResolvedLocale {
  lang: string;
  dir: 'ltr' | 'rtl';
}

function localeFromCookieHeader(cookieHeader: string | null | undefined): string | null {
  if (!cookieHeader) return null;
  const entry = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${LOCALE_COOKIE_NAME}=`));
  if (!entry) return null;
  const value = decodeURIComponent(entry.slice(LOCALE_COOKIE_NAME.length + 1));
  return SUPPORTED_LOCALES.includes(value) ? value : null;
}

function localeFromAcceptLanguage(acceptLanguage: string | null | undefined): string | null {
  if (!acceptLanguage) return null;
  const primary = acceptLanguage.split(',')[0]?.split('-')[0]?.trim().toLowerCase();
  return primary && SUPPORTED_LOCALES.includes(primary) ? primary : null;
}

/**
 * Resolves the locale/direction to render `<html lang>`/`dir` with,
 * preferring the user's persisted cookie choice over the Accept-Language
 * fallback so explicit `LanguageSwitcher` selections survive SSR.
 */
export function resolveLocaleFromRequest(
  cookieHeader: string | null | undefined,
  acceptLanguage: string | null | undefined,
): ResolvedLocale {
  const lang =
    localeFromCookieHeader(cookieHeader) ?? localeFromAcceptLanguage(acceptLanguage) ?? 'en';
  return { lang, dir: RTL_LOCALES.has(lang) ? 'rtl' : 'ltr' };
}

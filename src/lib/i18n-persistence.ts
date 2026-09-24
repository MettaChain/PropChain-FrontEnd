/**
 * Persist the user's explicit locale choice in a cookie so the server
 * can read it on the next request and match SSR lang/dir to the
 * client-selected locale instead of always falling back to
 * Accept-Language detection. See issue #1042.
 */
import type { Locale } from '@/lib/i18n-config';

const COOKIE_NAME = 'propchain_locale';
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export const rtlLocales: Locale[] = ['ar', 'he'];

export function persistLocale(locale: Locale) {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_NAME}=${locale}; path=/; max-age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
}

export function readLocaleCookie(cookieHeader: string | null | undefined): Locale | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  return (match?.[1] as Locale) || null;
}

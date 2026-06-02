import { useTranslation } from 'react-i18next';

/**
 * Locale mapping for proper Intl API locale strings
 * Maps i18next language codes to IETF language tags
 */
const localeMap: Record<string, string> = {
  'en': 'en-US',
  'es': 'es-ES',
  'fr': 'fr-FR',
  'de': 'de-DE',
  'zh': 'zh-CN',
  'ar': 'ar-SA',
  'he': 'he-IL',
};

/**
 * Get proper locale string for Intl API
 */
export const getIntlLocale = (locale: string): string => {
  return localeMap[locale] || 'en-US';
};

/**
 * Locale-specific default currency configuration
 */
const localeCurrencies: Record<string, string> = {
  'en': 'USD',
  'es': 'EUR',
  'fr': 'EUR',
  'de': 'EUR',
  'zh': 'CNY',
  'ar': 'SAR',
  'he': 'ILS',
};

/**
 * Get default currency for a locale
 */
export const getDefaultCurrency = (locale: string): string => {
  return localeCurrencies[locale] || 'USD';
};

// Currency formatting utility
export const formatCurrency = (
  amount: number,
  currency: string = 'USD',
  locale?: string
): string => {
  const targetLocale = getIntlLocale(locale || 'en');
  
  try {
    return new Intl.NumberFormat(targetLocale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fallback if currency is not supported
    return new Intl.NumberFormat(targetLocale, {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) + ' ' + currency;
  }
};

// Number formatting utility
export const formatNumber = (
  number: number,
  locale?: string,
  options?: Intl.NumberFormatOptions
): string => {
  const targetLocale = getIntlLocale(locale || 'en');
  
  return new Intl.NumberFormat(targetLocale, options).format(number);
};

// Percentage formatting utility
export const formatPercentage = (
  value: number,
  locale?: string,
  decimals: number = 1
): string => {
  const targetLocale = getIntlLocale(locale || 'en');
  
  return new Intl.NumberFormat(targetLocale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
};

// Date formatting utility
export const formatDate = (
  date: Date | string | number,
  locale?: string,
  options?: Intl.DateTimeFormatOptions
): string => {
  const targetLocale = getIntlLocale(locale || 'en');
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  
  return new Intl.DateTimeFormat(targetLocale, options || defaultOptions).format(dateObj);
};

// Short date formatting utility
export const formatShortDate = (
  date: Date | string | number,
  locale?: string
): string => {
  return formatDate(date, locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Time formatting utility
export const formatTime = (
  date: Date | string | number,
  locale?: string
): string => {
  return formatDate(date, locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Relative time formatting utility
export const formatRelativeTime = (
  date: Date | string | number,
  locale?: string
): string => {
  const targetLocale = getIntlLocale(locale || 'en');
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  const rtf = new Intl.RelativeTimeFormat(targetLocale, { numeric: 'auto' });
  
  if (diffInSeconds < 60) {
    return rtf.format(-diffInSeconds, 'second');
  } else if (diffInSeconds < 3600) {
    return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
  } else if (diffInSeconds < 86400) {
    return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
  } else if (diffInSeconds < 2592000) {
    return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
  } else {
    return formatDate(date, locale);
  }
};

// Hook for using formatting functions with current locale
export const useI18nFormatting = () => {
  const { i18n } = useTranslation();
  const currentLocale = i18n.language;
  const defaultCurrency = getDefaultCurrency(currentLocale);
  
  return {
    formatCurrency: (amount: number, currency?: string) => 
      formatCurrency(amount, currency || defaultCurrency, currentLocale),
    formatNumber: (number: number, options?: Intl.NumberFormatOptions) => 
      formatNumber(number, currentLocale, options),
    formatPercentage: (value: number, decimals?: number) => 
      formatPercentage(value, currentLocale, decimals),
    formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => 
      formatDate(date, currentLocale, options),
    formatShortDate: (date: Date | string | number) => 
      formatShortDate(date, currentLocale),
    formatTime: (date: Date | string | number) => 
      formatTime(date, currentLocale),
    formatRelativeTime: (date: Date | string | number) => 
      formatRelativeTime(date, currentLocale),
    locale: currentLocale,
    currency: defaultCurrency,
  };
};

// Get locale-specific formatting options
interface LocaleFormatOptions {
  currency: string;
  date: Intl.DateTimeFormatOptions;
  shortDate: Intl.DateTimeFormatOptions;
  timeFormat: string;
}

export const getLocaleFormatOptions = (locale: string): LocaleFormatOptions => {
  const localeFormats: Record<string, LocaleFormatOptions> = {
    'en': {
      currency: 'USD',
      date: { year: 'numeric', month: 'long', day: 'numeric' },
      shortDate: { year: 'numeric', month: 'short', day: 'numeric' },
      timeFormat: '12h',
    },
    'es': {
      currency: 'EUR',
      date: { day: 'numeric', month: 'long', year: 'numeric' },
      shortDate: { day: 'numeric', month: 'short', year: 'numeric' },
      timeFormat: '24h',
    },
    'fr': {
      currency: 'EUR',
      date: { day: 'numeric', month: 'long', year: 'numeric' },
      shortDate: { day: 'numeric', month: 'short', year: 'numeric' },
      timeFormat: '24h',
    },
    'de': {
      currency: 'EUR',
      date: { day: 'numeric', month: 'long', year: 'numeric' },
      shortDate: { day: 'numeric', month: 'short', year: 'numeric' },
      timeFormat: '24h',
    },
    'zh': {
      currency: 'CNY',
      date: { year: 'numeric', month: 'long', day: 'numeric' },
      shortDate: { year: 'numeric', month: 'short', day: 'numeric' },
      timeFormat: '24h',
    },
    'ar': {
      currency: 'SAR',
      date: { year: 'numeric', month: 'long', day: 'numeric' },
      shortDate: { year: 'numeric', month: 'short', day: 'numeric' },
      timeFormat: '24h',
    },
    'he': {
      currency: 'ILS',
      date: { day: 'numeric', month: 'long', year: 'numeric' },
      shortDate: { day: 'numeric', month: 'short', year: 'numeric' },
      timeFormat: '24h',
    },
  };
  
  return localeFormats[locale] || localeFormats['en'];
};

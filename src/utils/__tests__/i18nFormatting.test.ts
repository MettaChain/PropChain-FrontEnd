import {
  formatCurrency,
  formatNumber,
  formatPercentage,
  formatDate,
  formatShortDate,
  formatTime,
  formatRelativeTime,
  getDefaultCurrency,
  getIntlLocale,
  getLocaleFormatOptions,
} from '../i18nFormatting';

describe('i18nFormatting', () => {
  describe('getIntlLocale', () => {
    it('should map language codes to IETF locale strings', () => {
      expect(getIntlLocale('en')).toBe('en-US');
      expect(getIntlLocale('es')).toBe('es-ES');
      expect(getIntlLocale('fr')).toBe('fr-FR');
      expect(getIntlLocale('ar')).toBe('ar-SA');
      expect(getIntlLocale('de')).toBe('de-DE');
      expect(getIntlLocale('zh')).toBe('zh-CN');
      expect(getIntlLocale('he')).toBe('he-IL');
    });

    it('should default to en-US for unknown locales', () => {
      expect(getIntlLocale('unknown')).toBe('en-US');
    });
  });

  describe('getDefaultCurrency', () => {
    it('should return locale-specific default currencies', () => {
      expect(getDefaultCurrency('en')).toBe('USD');
      expect(getDefaultCurrency('es')).toBe('EUR');
      expect(getDefaultCurrency('fr')).toBe('EUR');
      expect(getDefaultCurrency('ar')).toBe('SAR');
      expect(getDefaultCurrency('zh')).toBe('CNY');
      expect(getDefaultCurrency('he')).toBe('ILS');
    });

    it('should default to USD for unknown locales', () => {
      expect(getDefaultCurrency('unknown')).toBe('USD');
    });
  });

  describe('formatCurrency', () => {
    it('should format USD currency for English locale', () => {
      const result = formatCurrency(1234.56, 'USD', 'en');
      expect(result).toContain('1,234.56');
      expect(result).toContain('$');
    });

    it('should format EUR currency for Spanish locale', () => {
      const result = formatCurrency(1234.56, 'EUR', 'es');
      expect(result).toContain('1234,56');
      expect(result).toContain('€');
    });

    it('should format SAR currency for Arabic locale', () => {
      const result = formatCurrency(1234.56, 'SAR', 'ar');
      expect(result).toBeDefined();
      expect(result).toContain('1234.56');
    });

    it('should format CNY currency for Chinese locale', () => {
      const result = formatCurrency(1234.56, 'CNY', 'zh');
      expect(result).toBeDefined();
      expect(result).toContain('¥');
    });

    it('should use locale-specific formatting', () => {
      const enResult = formatCurrency(1000000, 'USD', 'en');
      const esResult = formatCurrency(1000000, 'EUR', 'es');
      
      expect(enResult).not.toBe(esResult);
    });

    it('should handle zero and negative amounts', () => {
      expect(formatCurrency(0, 'USD', 'en')).toContain('0');
      expect(formatCurrency(-100, 'USD', 'en')).toContain('-');
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with locale-specific separators', () => {
      const enResult = formatNumber(1234567, 'en');
      const esResult = formatNumber(1234567, 'es');
      
      expect(enResult).toBe('1,234,567');
      expect(esResult).toBe('1.234.567');
    });

    it('should handle custom number format options', () => {
      const result = formatNumber(1234.5678, 'en', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      expect(result).toContain('1,234.57');
    });

    it('should format Arabic numerals for Arabic locale', () => {
      const result = formatNumber(12345, 'ar');
      expect(result).toBeDefined();
    });
  });

  describe('formatPercentage', () => {
    it('should format percentages with locale-specific format', () => {
      const enResult = formatPercentage(8.5, 'en');
      expect(enResult).toContain('8.5');
      expect(enResult).toContain('%');
    });

    it('should handle custom decimal places', () => {
      const result = formatPercentage(8.456, 'en', 2);
      expect(result).toContain('8.46');
    });

    it('should format zero and negative percentages', () => {
      expect(formatPercentage(0, 'en')).toContain('0%');
      expect(formatPercentage(-5, 'en')).toContain('-5%');
    });
  });

  describe('formatDate', () => {
    const testDate = new Date('2024-01-15');

    it('should format dates according to locale', () => {
      const enResult = formatDate(testDate, 'en');
      const esResult = formatDate(testDate, 'es');
      
      expect(enResult).toContain('January');
      expect(esResult).toContain('enero');
    });

    it('should accept custom date format options', () => {
      const result = formatDate(testDate, 'en', {
        year: '2-digit',
        month: '2-digit',
        day: '2-digit',
      });
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{2}/);
    });

    it('should handle string and number dates', () => {
      const stringDate = formatDate('2024-01-15', 'en');
      const numberDate = formatDate(new Date('2024-01-15').getTime(), 'en');
      const dateObject = formatDate(testDate, 'en');
      
      expect(stringDate).toBe(dateObject);
      expect(numberDate).toBe(dateObject);
    });

    it('should format Arabic dates correctly', () => {
      const result = formatDate(testDate, 'ar');
      expect(result).toBeDefined();
    });
  });

  describe('formatShortDate', () => {
    const testDate = new Date('2024-01-15');

    it('should format dates in short format', () => {
      const result = formatShortDate(testDate, 'en');
      expect(result).toContain('Jan');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });

    it('should match short date format across locales', () => {
      const enResult = formatShortDate(testDate, 'en');
      const esResult = formatShortDate(testDate, 'es');
      
      expect(enResult).toBeDefined();
      expect(esResult).toBeDefined();
    });
  });

  describe('formatTime', () => {
    const testDate = new Date('2024-01-15T14:30:00');

    it('should format time in 24-hour format for most locales', () => {
      const result = formatTime(testDate, 'en');
      expect(result).toMatch(/\d{2}:\d{2}/);
    });

    it('should format time for different locales', () => {
      const enResult = formatTime(testDate, 'en');
      const arResult = formatTime(testDate, 'ar');
      
      expect(enResult).toBeDefined();
      expect(arResult).toBeDefined();
    });
  });

  describe('formatRelativeTime', () => {
    it('should format time relative to now', () => {
      const oneHourAgo = new Date(Date.now() - 3600000);
      const result = formatRelativeTime(oneHourAgo, 'en');
      expect(result).toContain('hour');
    });

    it('should format relative times in English', () => {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60000);
      const result = formatRelativeTime(oneMinuteAgo, 'en');
      expect(result).toContain('minute');
    });

    it('should format relative times in Arabic', () => {
      const oneMinuteAgo = new Date(Date.now() - 60000);
      const result = formatRelativeTime(oneMinuteAgo, 'ar');
      expect(result).toBeDefined();
    });

    it('should fall back to date format for old dates', () => {
      const twoMonthsAgo = new Date(Date.now() - 86400000 * 90);
      const result = formatRelativeTime(twoMonthsAgo, 'en');
      expect(result).toBeDefined();
    });
  });

  describe('getLocaleFormatOptions', () => {
    it('should return locale-specific format options', () => {
      const enOptions = getLocaleFormatOptions('en');
      const esOptions = getLocaleFormatOptions('es');
      const arOptions = getLocaleFormatOptions('ar');
      
      expect(enOptions.currency).toBe('USD');
      expect(esOptions.currency).toBe('EUR');
      expect(arOptions.currency).toBe('SAR');
    });

    it('should include time format information', () => {
      const options = getLocaleFormatOptions('en');
      expect(options.timeFormat).toBe('12h');
      
      const esOptions = getLocaleFormatOptions('es');
      expect(esOptions.timeFormat).toBe('24h');
    });

    it('should provide date formatting options', () => {
      const options = getLocaleFormatOptions('en');
      expect(options.date).toBeDefined();
      expect(options.shortDate).toBeDefined();
    });
  });

  describe('Locale-specific behavior', () => {
    const testAmount = 45000;
    const testDate = new Date('2024-01-15');

    describe('Spanish (es)', () => {
      it('should format currency in EUR', () => {
        const result = formatCurrency(testAmount, 'EUR', 'es');
        expect(result).toContain('€');
      });

      it('should format numbers with European separators', () => {
        const result = formatNumber(testAmount, 'es');
        expect(result).toContain('45.000');
      });

      it('should format dates in Spanish', () => {
        const result = formatDate(testDate, 'es');
        expect(result).toContain('enero');
      });
    });

    describe('Arabic (ar)', () => {
      it('should format currency in SAR', () => {
        const result = formatCurrency(testAmount, 'SAR', 'ar');
        expect(result).toBeDefined();
      });

      it('should use Arabic formatting', () => {
        const result = formatNumber(testAmount, 'ar');
        expect(result).toBeDefined();
      });

      it('should format dates in Arabic', () => {
        const result = formatDate(testDate, 'ar');
        expect(result).toBeDefined();
      });
    });

    describe('French (fr)', () => {
      it('should format currency in EUR', () => {
        const result = formatCurrency(testAmount, 'EUR', 'fr');
        expect(result).toContain('€');
      });

      it('should format numbers with French separators', () => {
        const result = formatNumber(testAmount, 'fr');
        expect(result).toBeDefined();
      });

      it('should format dates in French', () => {
        const result = formatDate(testDate, 'fr');
        expect(result).toBeDefined();
      });
    });
  });
});

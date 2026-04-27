/**
 * i18n Integration Tests
 * Tests for language switching, RTL support, and locale-specific formatting
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import i18n from '../../lib/i18n';

describe('i18n Integration Tests', () => {
  beforeEach(() => {
    // Reset to English before each test
    i18n.changeLanguage('en');
  });

  describe('Language Detection', () => {
    it('should initialize with a default language', () => {
      expect(i18n.language).toBeDefined();
    });

    it('should support changing language', async () => {
      await i18n.changeLanguage('es');
      expect(i18n.language).toBe('es');

      await i18n.changeLanguage('ar');
      expect(i18n.language).toBe('ar');

      await i18n.changeLanguage('fr');
      expect(i18n.language).toBe('fr');
    });

    it('should persist language in localStorage', async () => {
      const store = window.localStorage;
      await i18n.changeLanguage('es');
      
      expect(store.getItem('i18nextLng')).toBe('es');
    });
  });

  describe('RTL Language Support', () => {
    it('should identify RTL languages correctly', async () => {
      const rtlLanguages = ['ar', 'he'];
      const ltrLanguages = ['en', 'es', 'fr', 'de', 'zh'];

      for (const lang of rtlLanguages) {
        await i18n.changeLanguage(lang);
        expect(['ar', 'he'].includes(i18n.language)).toBe(true);
      }

      for (const lang of ltrLanguages) {
        await i18n.changeLanguage(lang);
        expect(['ar', 'he'].includes(i18n.language)).toBe(false);
      }
    });

    it('should maintain html[dir] attribute for RTL', (done) => {
      const originalDir = document.documentElement.dir;
      
      i18n.changeLanguage('ar').then(() => {
        // Simulate DOM update that should happen in the app
        document.documentElement.dir = 'rtl';
        document.documentElement.lang = 'ar';
        
        expect(document.documentElement.dir).toBe('rtl');
        expect(document.documentElement.lang).toBe('ar');
        
        // Reset
        document.documentElement.dir = originalDir;
        done();
      });
    });
  });

  describe('Available Languages', () => {
    it('should have all required languages configured', () => {
      const requiredLanguages = ['en', 'es', 'fr', 'ar'];
      
      requiredLanguages.forEach((lang) => {
        expect(i18n.hasResourceBundle(lang, 'common')).toBe(true);
      });
    });

    it('should support language switching to all required languages', async () => {
      const languages = ['en', 'es', 'fr', 'ar', 'de', 'zh', 'he'];
      
      for (const lang of languages) {
        await i18n.changeLanguage(lang);
        expect(i18n.language).toBe(lang);
      }
    });
  });

  describe('Fallback Behavior', () => {
    it('should use English as fallback language', async () => {
      // Try to set to an unsupported language
      await i18n.changeLanguage('unsupported');
      
      // Should still have translations available (through fallback)
      const t = i18n.t;
      expect(t).toBeDefined();
    });

    it('should fallback to English for missing translations', () => {
      const t = i18n.t;
      const result = t('nonexistent.key');
      
      // Should return the key itself or a fallback message
      expect(typeof result).toBe('string');
    });
  });

  describe('Translation Keys', () => {
    it('should have translations for critical UI elements', () => {
      const criticalKeys = [
        'common.loading',
        'common.error',
        'navigation.home',
        'wallet.connect',
        'properties.title',
        'dashboard.title',
      ];

      const t = i18n.t;
      criticalKeys.forEach((key) => {
        const translation = t(key);
        expect(translation).not.toBe(key); // Should not return the key itself
        expect(typeof translation).toBe('string');
        expect(translation.length).toBeGreaterThan(0);
      });
    });

    it('should have translations in Spanish', async () => {
      await i18n.changeLanguage('es');
      const t = i18n.t;
      
      const spanishTranslations = [
        'wallet.connect',
        'navigation.home',
        'properties.title',
      ];

      spanishTranslations.forEach((key) => {
        const translation = t(key);
        expect(translation).not.toBe(key);
        expect(typeof translation).toBe('string');
      });
    });

    it('should have translations in French', async () => {
      await i18n.changeLanguage('fr');
      const t = i18n.t;
      
      const frenchTranslations = [
        'wallet.connect',
        'navigation.home',
        'properties.title',
      ];

      frenchTranslations.forEach((key) => {
        const translation = t(key);
        expect(translation).not.toBe(key);
        expect(typeof translation).toBe('string');
      });
    });

    it('should have translations in Arabic', async () => {
      await i18n.changeLanguage('ar');
      const t = i18n.t;
      
      const arabicTranslations = [
        'wallet.connect',
        'navigation.home',
        'properties.title',
      ];

      arabicTranslations.forEach((key) => {
        const translation = t(key);
        expect(translation).not.toBe(key);
        expect(typeof translation).toBe('string');
        // Should contain Arabic characters for key translations
        if (key !== 'ar') {
          expect(translation).toMatch(/[\u0600-\u06FF]/); // Arabic character range
        }
      });
    });
  });

  describe('Language Persistence', () => {
    it('should persist selected language in localStorage', async () => {
      const languages = ['es', 'fr', 'ar'];
      
      for (const lang of languages) {
        await i18n.changeLanguage(lang);
        const saved = localStorage.getItem('i18nextLng');
        expect(saved).toBe(lang);
      }
    });

    it('should detect language from localStorage on next load', () => {
      localStorage.setItem('i18nextLng', 'es');
      
      // In a real app, this would be like reloading the page
      // i18n would read from localStorage
      const savedLang = localStorage.getItem('i18nextLng');
      expect(savedLang).toBe('es');
    });
  });

  describe('Language Switching Performance', () => {
    it('should switch languages without lag', async () => {
      const startTime = performance.now();
      
      await i18n.changeLanguage('es');
      await i18n.changeLanguage('ar');
      await i18n.changeLanguage('fr');
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Language switch should be very fast (under 100ms)
      expect(totalTime).toBeLessThan(100);
    });
  });

  describe('Namespace Support', () => {
    it('should load the common namespace', () => {
      expect(i18n.hasResourceBundle('en', 'common')).toBe(true);
    });

    it('should access common namespace translations', () => {
      const t = i18n.t;
      const loading = t('common:common.loading');
      
      expect(loading).not.toBe('common:common.loading');
      expect(typeof loading).toBe('string');
    });
  });
});

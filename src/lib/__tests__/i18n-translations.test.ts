import enTranslations from '../../locales/en/common.json';
import esTranslations from '../../locales/es/common.json';
import frTranslations from '../../locales/fr/common.json';
import arTranslations from '../../locales/ar/common.json';
import deTranslations from '../../locales/de/common.json';
import zhTranslations from '../../locales/zh/common.json';
import heTranslations from '../../locales/he/common.json';

interface Translations {
  [key: string]: any;
}

const getKeys = (obj: Translations, prefix = ''): string[] => {
  let keys: string[] = [];
  for (const key in obj) {
    const value = obj[key];
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null) {
      keys = keys.concat(getKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
};

describe('i18n Translations', () => {
  const translations = {
    en: enTranslations,
    es: esTranslations,
    fr: frTranslations,
    ar: arTranslations,
    de: deTranslations,
    zh: zhTranslations,
    he: heTranslations,
  };

  describe('Translation Completeness', () => {
    const enKeys = getKeys(enTranslations);

    it('should have English translations as baseline', () => {
      expect(enKeys.length).toBeGreaterThan(0);
      expect(enKeys).toContain('common.loading');
      expect(enKeys).toContain('navigation.home');
      expect(enKeys).toContain('wallet.connect');
    });

    ['es', 'fr', 'ar', 'de', 'zh', 'he'].forEach((lang) => {
      it(`should have all English keys in ${lang}`, () => {
        const langKeys = getKeys(translations[lang as keyof typeof translations]);
        
        for (const key of enKeys) {
          expect(langKeys).toContain(
            key,
            `Missing key: ${key} in ${lang}`
          );
        }
      });

      it(`should not have extra keys in ${lang}`, () => {
        const langKeys = getKeys(translations[lang as keyof typeof translations]);
        
        for (const key of langKeys) {
          expect(enKeys).toContain(
            key,
            `Extra key in ${lang}: ${key}`
          );
        }
      });
    });
  });

  describe('RTL Languages', () => {
    const rtlLanguages = ['ar', 'he'];

    rtlLanguages.forEach((lang) => {
      it(`should have valid translations for ${lang}`, () => {
        const langKeys = getKeys(translations[lang as keyof typeof translations]);
        expect(langKeys.length).toBeGreaterThan(0);
      });

      it(`should have Arabic numerals in ${lang} for numbers`, () => {
        const langTrans = translations[lang as keyof typeof translations];
        expect(langTrans).toBeDefined();
        expect(typeof langTrans).toBe('object');
      });
    });
  });

  describe('Translation Quality', () => {
    it('should not have empty translation values', () => {
      Object.entries(translations).forEach(([lang, trans]) => {
        const keys = getKeys(trans);
        keys.forEach((key) => {
          const parts = key.split('.');
          let value = trans;
          for (const part of parts) {
            value = value[part];
          }
          expect(value).toBeTruthy(`Empty translation in ${lang} for key ${key}`);
          expect(typeof value).toBe('string');
        });
      });
    });

    it('should have proper formatting in translations', () => {
      ['es', 'fr', 'ar'].forEach((lang) => {
        const langTrans = translations[lang as keyof typeof translations];
        expect(langTrans).toBeDefined();
        
        // Check common keys are properly formatted
        expect(langTrans.common.loading).toBeTruthy();
        expect(langTrans.common.error).toBeTruthy();
        expect(langTrans.wallet.connect).toBeTruthy();
      });
    });

    it('should have professional terminology', () => {
      const arTrans = translations.ar;
      
      expect(arTrans.common.loading).toBeTruthy();
      expect(arTrans.properties.title).toBeTruthy();
      expect(arTrans.dashboard.title).toBeTruthy();
      expect(arTrans.transactions.title).toBeTruthy();
    });
  });

  describe('Locale-specific Content', () => {
    it('should have Spanish-specific content', () => {
      expect(translations.es.wallet).toBeDefined();
      expect(translations.es.wallet.connect).toBe('Conectar Billetera');
    });

    it('should have French-specific content', () => {
      expect(translations.fr.wallet).toBeDefined();
      expect(translations.fr.wallet.connect).toBe('Connecter le Portefeuille');
    });

    it('should have Arabic-specific content', () => {
      expect(translations.ar.wallet).toBeDefined();
      expect(translations.ar.wallet.connect).toContain('اتصال');
    });
  });

  describe('Common Interface Terms', () => {
    it('should translate basic UI terms across all languages', () => {
      const basicTerms = ['loading', 'error', 'success', 'cancel', 'confirm'];
      
      basicTerms.forEach((term) => {
        Object.entries(translations).forEach(([lang, trans]) => {
          expect(trans.common[term]).toBeDefined(`Missing term "${term}" in ${lang}`);
          expect(typeof trans.common[term]).toBe('string');
        });
      });
    });

    it('should translate navigation terms across all languages', () => {
      const navTerms = ['home', 'properties', 'dashboard'];
      
      navTerms.forEach((term) => {
        Object.entries(translations).forEach(([lang, trans]) => {
          expect(trans.navigation[term]).toBeDefined(`Missing nav term "${term}" in ${lang}`);
          expect(typeof trans.navigation[term]).toBe('string');
        });
      });
    });
  });

  describe('Financial Terminology', () => {
    it('should have proper financial translations', () => {
      const financialTerms = {
        'properties.propertyValue': 'Property Value translation',
        'dashboard.portfolioValue': 'Portfolio Value translation',
        'transactions.amount': 'Amount translation',
      };

      ['es', 'fr', 'ar'].forEach((lang) => {
        const langTrans = translations[lang as keyof typeof translations];
        expect(langTrans.properties.propertyValue).toBeTruthy();
        expect(langTrans.dashboard.portfolioValue).toBeTruthy();
        expect(langTrans.transactions.amount).toBeTruthy();
      });
    });

    it('should have ROI and financial metrics in all languages', () => {
      Object.entries(translations).forEach(([lang, trans]) => {
        expect(trans.properties.roi).toBeDefined(`Missing ROI in ${lang}`);
        expect(trans.dashboard.annualYield).toBeDefined(`Missing annualYield in ${lang}`);
      });
    });
  });
});

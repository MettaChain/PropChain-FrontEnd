import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import translation files
import enTranslations from "../locales/en/common.json";
import esTranslations from "../locales/es/common.json";
import frTranslations from "../locales/fr/common.json";
import deTranslations from "../locales/de/common.json";
import zhTranslations from "../locales/zh/common.json";
import arTranslations from "../locales/ar/common.json";
import heTranslations from "../locales/he/common.json";

const resources = {
  en: {
    common: enTranslations,
  },
  es: {
    common: esTranslations,
  },
  fr: {
    common: frTranslations,
  },
  de: {
    common: deTranslations,
  },
  zh: {
    common: zhTranslations,
  },
  ar: {
    common: arTranslations,
  },
  he: {
    common: heTranslations,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    debug: process.env.NODE_ENV === "development",

    interpolation: {
      escapeValue: false,
    },

    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
    },

    defaultNS: "common",
    ns: ["common"],
  });

export default i18n;

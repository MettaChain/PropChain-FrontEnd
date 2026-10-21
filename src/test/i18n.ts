/**
 * Test helper that boots i18next with the real translation resources.
 *
 * The application initialises i18next in `src/lib/i18n.ts`, which turns the
 * debug log on in development and installs the browser language detector.
 * Both are unhelpful in a test run: the detector picks a language from the
 * environment instead of the one the test asks for, and the debug log buries
 * the test output.
 *
 * Importing this module gives a test the same translations the application
 * renders, with the language under the control of the test.
 */
import i18n from "i18next"
import { initReactI18next } from "react-i18next"

import arTranslations from "@/locales/ar/common.json"
import deTranslations from "@/locales/de/common.json"
import enTranslations from "@/locales/en/common.json"
import esTranslations from "@/locales/es/common.json"
import frTranslations from "@/locales/fr/common.json"
import heTranslations from "@/locales/he/common.json"
import zhTranslations from "@/locales/zh/common.json"

export const testResources = {
  en: { common: enTranslations },
  es: { common: esTranslations },
  fr: { common: frTranslations },
  de: { common: deTranslations },
  zh: { common: zhTranslations },
  ar: { common: arTranslations },
  he: { common: heTranslations },
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: testResources,
    lng: "en",
    fallbackLng: "en",
    defaultNS: "common",
    ns: ["common"],
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  })
}

export default i18n

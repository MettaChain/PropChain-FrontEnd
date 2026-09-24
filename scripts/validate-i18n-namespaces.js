#!/usr/bin/env node
/**
 * CI check: every namespace declared in src/lib/i18n-config.ts must have
 * a matching JSON file for every supported locale. See issue #1039.
 */
const fs = require('fs');
const path = require('path');

const locales = ['en', 'ar', 'de', 'es', 'fr', 'he', 'zh'];
const namespaces = [
  'common', 'navigation', 'wallet', 'properties', 'transactions',
  'governance', 'tax', 'errors', 'accessibility', 'referral',
];

const localesDir = path.join(__dirname, '..', 'src', 'locales');
const missing = [];

for (const locale of locales) {
  for (const ns of namespaces) {
    const file = path.join(localesDir, locale, `${ns}.json`);
    if (!fs.existsSync(file)) {
      missing.push(`${locale}/${ns}.json`);
    }
  }
}

if (missing.length > 0) {
  console.error(`Missing ${missing.length} i18n namespace file(s):`);
  missing.forEach((f) => console.error(`  - ${f}`));
  process.exit(1);
}

console.log('All i18n namespace files present.');

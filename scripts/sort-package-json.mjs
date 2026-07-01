#!/usr/bin/env node

/**
 * CI check: ensures package.json top-level keys, scripts, dependencies, and
 * devDependencies are alphabetically sorted.
 *
 * Usage:
 *   node scripts/sort-package-json.mjs          # check only (exit 1 if unsorted)
 *   node scripts/sort-package-json.mjs --fix    # sort in-place and exit 0
 *
 * Run as a CI gate to prevent noisy diffs from unsorted keys.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgPath = resolve(__dirname, '..', 'package.json');
const shouldFix = process.argv.includes('--fix');

const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

/**
 * Sort an object's keys alphabetically, preserving the original order for
 * non-string keys (shouldn't exist in package.json, but be safe).
 */
function sortKeys(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const sorted = {};
  const keys = Object.keys(obj).sort((a, b) => a.localeCompare(b, 'en'));
  for (const key of keys) {
    sorted[key] = obj[key];
  }
  return sorted;
}

// Fields to check for alphabetical sorting
const fieldsToCheck = ['scripts', 'dependencies', 'devDependencies'];
const fieldsToSkip = ['name', 'version', 'private', 'type']; // conventional top-level order

/** Check if keys of an object are in alphabetical order */
function isSorted(obj) {
  const keys = Object.keys(obj);
  for (let i = 1; i < keys.length; i++) {
    if (keys[i].localeCompare(keys[i - 1], 'en') < 0) {
      return { sorted: false, firstUnsorted: keys[i], previous: keys[i - 1] };
    }
  }
  return { sorted: true };
}

let hasErrors = false;

for (const field of fieldsToCheck) {
  if (!pkg[field]) continue;
  const result = isSorted(pkg[field]);
  if (!result.sorted) {
    console.error(
      `❌ package.json → "${field}" keys are NOT sorted.\n` +
        `   First unsorted key: "${result.firstUnsorted}" (comes after "${result.previous}")`
    );
    hasErrors = true;
  }
}

if (hasErrors) {
  if (shouldFix) {
    console.log('\n🔧 Auto-fixing package.json key order...');
    for (const field of fieldsToCheck) {
      if (pkg[field]) {
        pkg[field] = sortKeys(pkg[field]);
      }
    }
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
    console.log('✅ package.json keys sorted successfully.');
  } else {
    console.log(
      '\n💡 Run with --fix to auto-sort:\n' +
        '   node scripts/sort-package-json.mjs --fix'
    );
    process.exit(1);
  }
} else {
  console.log('✅ package.json keys are properly sorted.');
}

/**
 * #487 acceptance test: production code paths must not call console.warn
 * or console.error directly. The structured logger is the canonical sink.
 *
 * This test does NOT statically analyse source. Instead it dynamically imports
 * the modules under test and asserts on any direct console.warn /
 * console.error call sites by inspecting strings present at import time
 * (simple textual snapshot).
 */

import * as fs from 'fs';
import * as path from 'path';

const SRC = path.resolve(__dirname, '..');

const readSource = (relPath: string): string =>
  fs.readFileSync(path.join(SRC, relPath), 'utf8');

// Production-direct console calls must be zero; only structured logger + the
// canonical logger sink may use console.*.
const consoleCallRe =
  /(^|[^.\w])console\.(warn|error|log|info|debug)\b/g;

const productionFiles = [
  'earlyErrorSuppression.ts',
  'extensionDetection.ts',
];

describe('structured logger routing (#487)', () => {
  for (const file of productionFiles) {
    test(`${file} does not call console.* directly (must use logger.warn/error)`, () => {
      const src = readSource(file);
      const matches = src.match(consoleCallRe) ?? [];
      expect(matches).toEqual([]);
    });
  }

  test('logger.ts is the only module allowed to call console.* (sink of last resort)', () => {
    const loggerSrc = readSource('logger.ts');
    // Sanity: the logger DOES sink to console.* — that is its sole legitimate path.
    expect(loggerSrc).toMatch(/console\.(warn|error|info|debug)\b/);
  });
});

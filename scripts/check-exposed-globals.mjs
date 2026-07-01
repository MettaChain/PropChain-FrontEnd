import { readFileSync, existsSync } from 'fs';
import { glob } from 'glob';

const SENSITIVE_PATTERNS = [
  /__[A-Z][A-Z_]+__/g,
];

async function main() {
  const files = await glob('src/**/*.{ts,tsx,js,jsx}', {
    ignore: ['src/**/*.test.*', 'src/**/__tests__/**', 'node_modules/**'],
  });

  let hasError = false;

  for (const file of files) {
    if (!existsSync(file)) continue;
    const content = readFileSync(file, 'utf-8');
    const matches = content.match(SENSITIVE_PATTERNS[0]);
    if (matches) {
      for (const match of matches) {
        console.error(`[FAIL] Found exposed global '${match}' in ${file}`);
        hasError = true;
      }
    }
  }

  if (hasError) {
    process.exit(1);
  }

  console.log('[PASS] No exposed globals found.');
}

main().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});

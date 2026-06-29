// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [{
  ignores: ["node_modules/**", ".next/**", "out/**", "dist/**", "coverage/**"],
}, {
  files: ["src/**/*.{ts,tsx}"],
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      project: ["./tsconfig.json"],
      tsconfigRootDir: import.meta.dirname,
      ecmaVersion: "latest",
      sourceType: "module",
    },
  },
  plugins: {
    "@typescript-eslint": tseslint,
  },
  rules: {
    // Warn on `as any` / `: any` in new code; existing justified survivors are
    // documented in docs/as-any-survivors.md.  Set to "warn" so CI surfaces
    // regressions without hard-failing on the one remaining legacy site.
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/consistent-type-imports": "off",
    "@typescript-eslint/no-unnecessary-type-assertion": "off",
    // Enforce the single canonical logger import path.
    // structuredLogger is a backwards-compat wrapper; new code MUST import
    // from '@/utils/logger' instead.  See README § "Logging".
    "no-restricted-imports": ["error", {
      patterns: [{
        group: [
          "@/utils/structuredLogger",
          "./structuredLogger",
          "../utils/structuredLogger",
          "../../utils/structuredLogger",
        ],
        message: "Import from '@/utils/logger' instead. '@/utils/structuredLogger' is a thin backwards-compat wrapper and is deprecated.",
      }],
    }],
  },
}, {
  // earlyErrorSuppression.ts runs BEFORE logger.ts is loaded and must
  // intercept raw console output.  Exempt it from no-console.
  files: ["src/utils/earlyErrorSuppression.ts"],
  rules: {
    "no-console": "off",
  },
}, {
  // Apply `no-console` to everything else so future direct console.* calls
  // are caught at lint time.
  files: ["src/**/*.{ts,tsx}"],
  ignores: [
    // earlyErrorSuppression.ts intentionally uses raw console; logger.ts
    // and the deprecated structuredLogger.ts wrap it.
    "src/utils/earlyErrorSuppression.ts",
    "src/utils/logger.ts",
    "src/utils/structuredLogger.ts",
    // Test files and stories legitimately use console.* for debug output
    // and assertions.
    "src/**/__tests__/**",
    "src/**/*.test.{ts,tsx}",
    "src/**/*.stories.{ts,tsx}",
  ],
  rules: {
    // disallow all console.* (no `allow` options provided).
    "no-console": "error",
  },
}, ...storybook.configs["flat/recommended"]];

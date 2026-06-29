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
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/consistent-type-imports": "off",
    "@typescript-eslint/no-unnecessary-type-assertion": "off",
    // Escalated to `error` to enforce routing through the structured logger.
    // The override below re-enables console.* in `src/utils/logger.ts` only —
    // that file is the canonical, mandatory sink for the logger pipeline.
    "no-console": "error",
  },
}, {
  // The structured logger sink is the only file allowed to call console.*
  // directly. Any other module must go through `logger.{debug,info,warn,error}`.
  files: ["src/utils/logger.ts"],
  rules: {
    "no-console": "off",
  },
}, ...storybook.configs["flat/recommended"]];

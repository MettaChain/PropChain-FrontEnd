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
  },
}, ...storybook.configs["flat/recommended"]];

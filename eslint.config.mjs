// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";
import jsdoc from "eslint-plugin-jsdoc";

import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

/*
 * ESLint Allow-List (Issue #482)
 *
 * The following files contain intentional eslint-disable directives that
 * cannot be expressed via flat-config rule overrides because the relevant
 * plugins (react, @next/next, jsx-a11y) are loaded by Next.js's built-in
 * ESLint integration, not by this configuration file.
 *
 * Known exceptions:
 *
 * react/no-danger
 *   - src/app/layout.tsx: Inline theme-bootstrap script (static string, no XSS risk).
 *   - src/components/ui/chart.tsx: ChartStyle DOMPurify-sanitised CSS (no XSS risk).
 *
 * @next/next/no-img-element
 *   - src/app/accessibility/page.tsx: Accessibility demo page using <img> with alt text.
 *   - src/components/security/TransactionSecuritySettings.tsx: Dynamically generated QR
 *     code data URL — Next.js <Image> does not support data: URLs.
 *   - src/components/__tests__/MobilePropertyViewer.test.tsx: next/image mock in test.
 *   - src/components/__tests__/MobilePropertyCard.test.tsx: next/image mock in test.
 *
 * jsx-a11y/alt-text
 *   - src/components/__tests__/MobilePropertyViewer.test.tsx: next/image mock in test.
 *   - src/components/__tests__/MobilePropertyCard.test.tsx: next/image mock in test.
 *
 * react/display-name
 *   - src/components/__tests__/RecentlyViewed.test.tsx: next/link mock in test.
 *   - src/components/__tests__/ComparisonBar.test.tsx: next/link mock in test.
 *
 * no-var
 *   - src/utils/security/__tests__/totp.test.ts: declare global { var crypto } pattern
 *     for Web Crypto API polyfill (required by the language).
 *
 * react-hooks/exhaustive-deps
 *   - src/app/properties/page.tsx: Intentional sync-on-URL-change effects that must
 *     not re-run when the store setter references change.
 */

export default [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "dist/**",
      "coverage/**",
    ],
  },
  {
    // `.storybook/**` is included so the Storybook config is parsed and linted
    // like the rest of the TypeScript in the repo. Without it these files match
    // no config with a `files` pattern, get picked up by the default parser and
    // fail on TS-only syntax.
    files: ["src/**/*.{ts,tsx}", ".storybook/**/*.{ts,tsx}"],
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
      jsdoc,
    },
    rules: {
      // Warn on `as any` / `: any` in new code; existing justified survivors are
      // documented in docs/as-any-survivors.md.  Set to "warn" so CI surfaces
      // regressions without hard-failing on the one remaining legacy site.
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/consistent-type-imports": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
      // Escalated to `error` to enforce routing through the structured logger.
      // The override below re-enables console.* in `src/utils/logger.ts` only —
      // that file is the canonical, mandatory sink for the logger pipeline.
      "no-console": "error",
    },
  },
  {
    // jsdoc/require-jsdoc is scoped by file pattern as well as by `publicOnly`
    // (#1087).
    //
    // src/lib and src/hooks are the shared infrastructure other modules import,
    // so an undocumented export there is the one that actually costs a reader
    // time. Every export in both directories is documented as of this change, so
    // the rule is green and new exports get told off immediately.
    //
    // Intentionally not yet applied to src/components (375 undocumented
    // exports), src/app (47), src/utils (33), src/types, src/features, src/store
    // or src/providers. Component contracts are largely expressed by their props
    // types and Next route files export framework-required symbols like
    // `default` and `metadata`, so blanket JSDoc there is mostly noise. Widen the
    // globs below one directory at a time, documenting as you go, rather than
    // turning the rule on everywhere and reintroducing a wall of errors.
    files: ["src/lib/**/*.{ts,tsx}", "src/hooks/**/*.{ts,tsx}"],
    plugins: { jsdoc },
    rules: {
      // Scoped to the exported public API (#1087).
      //
      // This previously required JSDoc on every FunctionDeclaration,
      // MethodDefinition, ClassDeclaration, ArrowFunctionExpression and
      // FunctionExpression, plus every ExportNamedDeclaration - 3,500 errors
      // across src/, including tests and stories. A gate that size is not a
      // gate: it either fails the build permanently or teaches contributors to
      // suppress it.
      //
      // `publicOnly` limits the rule to declarations other modules can reach,
      // which is where documentation actually pays off. Internal helpers and
      // inline callbacks are exempt; `jsdoc/require-description` stays off so
      // an empty block is not rewarded.
      "jsdoc/require-jsdoc": [
        "error",
        {
          publicOnly: true,
          require: {
            FunctionDeclaration: true,
            ClassDeclaration: true,
            // Exported methods are documented on their class; inline functions
            // and arrows are implementation detail.
            MethodDefinition: false,
            ArrowFunctionExpression: false,
            FunctionExpression: false,
          },
          enableFixer: false,
        },
      ],
  },
  },
  {
    // Canonical Web3 stack boundary (#1095, ADR-006).
    //
    // viem + wagmi is the app's Web3 stack. `ethers` is retained only where a
    // third party forces it: the Gnosis Safe protocol-kit `EthersAdapter` and
    // EIP-712 typed-data signing. This rule stops that exception from quietly
    // spreading back across the codebase, which is how the repo ended up with
    // two signing/encoding stacks and double bundle weight in the first place.
    //
    // The allowlist is deliberately short, and shrinking it is the goal:
    //   - src/types/ethersSigner.ts        re-exports the JsonRpcSigner type
    //   - src/hooks/useSafeInfo.ts         Safe protocol-kit adapter (value use)
    //   - src/utils/eip712/eip712Signing.ts EIP-712 typed-data signing (value use)
    files: ["src/**/*.{ts,tsx}"],
    ignores: [
      "src/types/ethersSigner.ts",
      "src/hooks/useSafeInfo.ts",
      "src/utils/eip712/eip712Signing.ts",
      // Tests assert against the real ethers behaviour of the two boundary
      // modules above, so they are allowed to import it directly.
      "src/**/__tests__/**",
      "src/**/*.test.{ts,tsx}",
      "src/**/*.spec.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "ethers",
              message:
                "viem + wagmi is the canonical Web3 stack (ADR-006). Do not import `ethers` here. If you need the EIP-712/Safe signer type, import it from `@/types/ethersSigner`; if you are adding real ethers functionality, it belongs in src/utils/eip712/eip712Signing.ts or src/hooks/useSafeInfo.ts and should come with an ADR update.",
            },
            {
              name: "@ethersproject/*",
              message:
                "The legacy `@ethersproject/*` packages are not part of the Web3 stack (ADR-006). Use `viem` or the `ethers` facade allowed in src/utils/eip712/eip712Signing.ts and src/hooks/useSafeInfo.ts.",
            },
          ],
        },
      ],
    },
  },
  {
    // Tests, stories and type-declaration files are exempt from the public-API
    // docs requirement: their exports exist for the test runner or Storybook,
    // not for other modules to consume (#1087).
    files: [
      "src/**/__tests__/**",
      "src/**/*.test.{ts,tsx}",
      "src/**/*.spec.{ts,tsx}",
      "src/**/*.stories.{ts,tsx}",
      "src/**/*.d.ts",
    ],
    rules: {
      "jsdoc/require-jsdoc": "off",
    },
  },
  {
    // The structured logger sink is the only file allowed to call console.*
    // directly. Any other module must go through `logger.{debug,info,warn,error}`.
    files: ["src/utils/logger.ts"],
    rules: {
      "no-console": "off",
    },
  },
  {
    // Apply `no-console` to everything else so future direct console.* calls
    // are caught at lint time.
    files: ["src/**/*.{ts,tsx}"],
    ignores: [
      // earlyErrorSuppression.ts intentionally uses raw console; logger.ts
      // and the deprecated structuredLogger.ts wrap it.
      "src/utils/earlyErrorSuppression.ts",
      "src/utils/logger.ts",
      "src/utils/structuredLogger.ts",
      // extensionDetection.ts intentionally overrides console.error to filter
      // noisy browser-extension errors that are not actionable.
      "src/utils/extensionDetection.ts",
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
  },
  ...storybook.configs["flat/recommended"],
];

/**
 * Enforce deep imports across components.
 *
 * Prevents importing from barrel files such as:
 *   import { Button } from "@/components";
 *
 * Encourages:
 *   import Button from "@/components/ui/Button";
 */

export const deepImportRules = {
  "no-restricted-imports": [
    "warn",
    {
      paths: [
        {
          name: "@/components",
          message:
            "Use deep imports instead of barrel imports for better code-splitting.",
        },
      ],
      patterns: [
        {
          group: [
            "@/components/index",
            "@/components/**/index",
          ],
          message:
            "Import components directly from their source file instead of a barrel export.",
        },
      ],
    },
  ],
};
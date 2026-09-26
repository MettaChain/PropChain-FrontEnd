import type { StorybookConfig } from "@storybook/nextjs-vite";

/**
 * Storybook configuration (#1096).
 *
 * This directory was never committed even though `package.json` exposes
 * `storybook` / `build-storybook` / `test:storybook` scripts and
 * `vitest.config.ts` points `storybookTest` at this path. Without it,
 * `npm run storybook` could not start and the Vitest story project could not
 * resolve any story.
 */
const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(ts|tsx)"],
  addons: [
    "@storybook/addon-docs",
    // Runs axe-core against every story render; this is the gate the CI
    // `storybook` job relies on.
    "@storybook/addon-a11y",
    "@storybook/addon-vitest",
  ],
  framework: {
    name: "@storybook/nextjs-vite",
    options: {},
  },
  typescript: {
    // Prop tables are generated from the TS types, so a broken type in a
    // story should fail the build rather than render a blank panel.
    reactDocgen: "react-docgen-typescript",
  },
  viteFinal: async (config) => ({
    ...config,
    resolve: {
      ...config.resolve,
      alias: {
        ...config.resolve?.alias,
        "@": new URL("../src", import.meta.url).pathname,
      },
    },
  }),
};

export default config;

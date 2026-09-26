import type { Preview } from "@storybook/nextjs-vite";

import "../src/app/globals.css";

/**
 * Global Storybook preview configuration (#1096).
 *
 * This is a `.tsx` file because the RTL decorator below renders JSX.
 */
const preview: Preview = {
  parameters: {
    // addon-a11y runs axe-core on every story render. The default `todo` is kept
    // deliberately: flipping this to `error` gates CI on axe across the whole
    // story inventory, and the existing stories still carry violations that
    // have never been triaged. Report-only surfaces them per story now, and
    // the flip to `error` is a separate, measurable step once the inventory is
    // clean. Stories that care about a specific rule narrow it in their own
    // `parameters.a11y.config.rules` block.
    a11y: {
      test: "todo",
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    // Lets any story opt into RTL without duplicating its render tree:
    //   parameters: { direction: "rtl" }
    //
    // The wrapper carries `dir` rather than mutating documentElement, so the
    // addon panels and the Docs page keep their own LTR chrome and only the
    // component under test is mirrored.
    (Story, context) => {
      const { direction } = context.parameters;
      if (!direction) return <Story />;

      return (
        <div dir={direction} style={{ width: "100%" }}>
          <Story />
        </div>
      );
    },
  ],
};

export default preview;

# Guide: Setting Up Storybook Stories for New Components

Reference: `.storybook/main.ts`, `.storybook/preview.tsx`, and the stories in `src/stories/` (`Button.stories.ts`, `ThemeSwitcher.stories.tsx`).

## Configuration check (read first)

`.storybook/main.ts` currently loads only:

```ts
stories: ["../src/**/*.mdx", "../src/**/*.stories.@(ts|tsx)"],
```

Stories placed in `ui-extensions/stories/` are therefore **not discovered** until that glob also covers `../ui-extensions/**/*.stories.@(ts|tsx)`. Changing `.storybook/` is outside `ui-extensions/`, so it needs to be a separate, explicitly approved change. Until then, the structure below is correct but the stories only render once that glob is added.

Other facts from the config: framework `@storybook/nextjs-vite`; addons `@storybook/addon-docs`, `@storybook/addon-a11y`, `@storybook/addon-vitest`; the `@` alias points at `src/`; `src/app/globals.css` is imported globally.

## Story structure (CSF 3)

A story file is `ComponentName.stories.tsx` with a default export (`meta`) describing the component and named exports for each state:

```tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { Component } from "../components/Component";

const meta = {
  title: "Extensions/Component", // sidebar path
  component: Component,
  tags: ["autodocs"], // generate a Docs page
  parameters: { layout: "centered" },
  args: { onClick: fn() }, // spy shown in the Actions panel
} satisfies Meta<typeof Component>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { label: "Hello" } };
```

`satisfies Meta<typeof Component>` plus `StoryObj<typeof meta>` gives typed `args`.

## args and argTypes

- `args` set prop values per story and drive the Controls panel. Put shared args in `meta.args`, state-specific ones in the story.
- `argTypes` override how a prop's control looks. `Button.stories.ts` uses `argTypes: { backgroundColor: { control: 'color' } }`.
- `.storybook/preview.tsx` has `controls.matchers` so props ending in `color`/`background` get a color picker and props ending in `Date` get a date picker automatically.
- Use `fn()` from `storybook/test` for callback props.

## Decorators

A decorator wraps a story. `.storybook/preview.tsx` already registers a global one: set `parameters: { direction: "rtl" }` on a story to render it right-to-left. Add per-story or per-file decorators for local needs:

```tsx
export const InCard: Story = {
  decorators: [
    (Story) => (
      <div style={{ padding: "1rem", maxWidth: 360 }}>
        <Story />
      </div>
    ),
  ],
};
```

Put the same `decorators` array on `meta` to apply it to every story in the file.

## Dark mode story

`ThemeSwitcher.stories.tsx` simulates dark mode by wrapping the story in an element with the `dark` class (the app adds `dark` to `<html>`):

```tsx
export const DarkMode: Story = {
  decorators: [
    (Story) => (
      <div className="dark" style={{ padding: "1rem", background: "#1a1a2e", borderRadius: "0.5rem" }}>
        <Story />
      </div>
    ),
  ],
};
```

Use this to check contrast in both themes.

## Complete example

```tsx
// ui-extensions/stories/ToggleButton.stories.tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { ToggleButton } from "../components/ToggleButton"; // hypothetical component

const meta = {
  title: "Extensions/ToggleButton",
  component: ToggleButton,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  argTypes: { pressed: { control: "boolean" } },
  args: { label: "Favorite", pressed: false, onToggle: fn() },
} satisfies Meta<typeof ToggleButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Pressed: Story = { args: { pressed: true } };
export const DarkMode: Story = {
  decorators: [
    (Story) => (
      <div className="dark" style={{ padding: "1rem", background: "#1a1a2e" }}>
        <Story />
      </div>
    ),
  ],
};
```

`ToggleButton` is a placeholder; replace it with your own component under `ui-extensions/components/`.

## Accessibility checks

`@storybook/addon-a11y` runs axe on every story; `preview.tsx` sets `a11y.test: "todo"` (report only). To tune a story, set `parameters.a11y.config.rules`.

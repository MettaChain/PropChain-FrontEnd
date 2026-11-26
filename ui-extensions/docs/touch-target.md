# Touch target wrapper

`components/TouchTarget.tsx` expands a compact semantic button or link's pointer area to at least 44 by 44 CSS pixels with an absolutely positioned pseudo-element. The original element keeps its visual dimensions, keyboard behavior, accessible name, and event handlers.

```tsx
import TouchTarget from "./components/TouchTarget";

<TouchTarget>
  <button type="button" aria-label="Save this property" className="p-1">
    <StarIcon aria-hidden="true" />
  </button>
</TouchTarget>

<TouchTarget>
  <a href="/properties/123">View property</a>
</TouchTarget>
```

Use a real `<button>` or `<a>` as the child. Put decorative icons inside the control and give icon-only controls an accessible name. Avoid placing expanded targets close enough to overlap; neighboring hit areas should remain independently tappable. The `UI Extensions/TouchTarget` Storybook story demonstrates buttons, icons, and links.

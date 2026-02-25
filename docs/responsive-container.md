# ResponsiveContainer Component

## Overview

The `ResponsiveContainer` component provides consistent, viewport-aware padding that automatically adapts to different screen sizes. It's a foundational layout component for building responsive pages in the PropChain application.

## Features

- **Responsive Padding**: Automatically scales padding based on viewport size
  - Mobile (<768px): 16px padding
  - Tablet (768-1024px): 24px padding
  - Desktop (≥1024px): 32px padding
- **No Horizontal Overflow**: Ensures content never exceeds viewport width
- **Custom Styling**: Supports className prop for additional styling
- **SSR Safe**: Works correctly during server-side rendering
- **Two Variants**: Step-based (default) and fluid scaling

## Requirements Validated

- **Requirement 3.1**: No horizontal overflow on mobile
- **Requirement 3.2**: Proportional spacing scaling between breakpoints
- **Requirement 8.5**: Responsive padding and margin values

## Usage

### Basic Usage

```tsx
import { ResponsiveContainer } from '@/components/responsive';

function MyPage() {
  return (
    <ResponsiveContainer>
      <h1>Page Title</h1>
      <p>Page content with responsive padding</p>
    </ResponsiveContainer>
  );
}
```

### With Custom Styling

```tsx
<ResponsiveContainer className="bg-gray-100 rounded-lg shadow-md">
  <h2>Card Content</h2>
  <p>This container has custom background and styling</p>
</ResponsiveContainer>
```

### Fluid Scaling Variant

For smooth, continuous padding scaling instead of step-based changes:

```tsx
import { ResponsiveContainerFluid } from '@/components/responsive';

<ResponsiveContainerFluid>
  <p>This padding scales smoothly with viewport width</p>
</ResponsiveContainerFluid>
```

## Component Variants

### ResponsiveContainer (Default)

Uses step-based padding that changes at breakpoints:
- Provides predictable, consistent padding at each viewport category
- Better for layouts that need distinct mobile/tablet/desktop designs
- Uses the Viewport Provider for viewport detection

### ResponsiveContainerFluid

Uses CSS `clamp()` for fluid padding:
- Provides smooth, continuous scaling between min and max values
- Better for designs that need seamless transitions
- Formula: `clamp(16px, 4vw, 32px)`

## Props

### ResponsiveContainerProps

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| children | ReactNode | Yes | - | Content to render inside the container |
| className | string | No | - | Additional CSS classes to apply |

## Implementation Details

### Viewport Detection

The component uses the `useViewport` hook from `ViewportProvider` to detect the current viewport category:

```tsx
const { category } = useViewport();
```

### Padding Calculation

Padding is calculated based on viewport category:

```tsx
const getPadding = (): string => {
  switch (category) {
    case 'mobile': return '16px';
    case 'tablet': return '24px';
    case 'desktop': return '32px';
    default: return '16px';
  }
};
```

### Overflow Prevention

The component ensures no horizontal overflow by setting:
- `maxWidth: '100%'` - Prevents content from exceeding viewport width
- `boxSizing: 'border-box'` - Includes padding in width calculation

## Examples

### Page Layout

```tsx
function PropertyPage() {
  return (
    <div>
      {/* Header */}
      <ResponsiveContainer className="bg-white border-b">
        <header>
          <h1>PropChain</h1>
          <nav>...</nav>
        </header>
      </ResponsiveContainer>

      {/* Main Content */}
      <ResponsiveContainer className="py-8">
        <main>
          <h2>Featured Properties</h2>
          {/* Property listings */}
        </main>
      </ResponsiveContainer>

      {/* Footer */}
      <ResponsiveContainer className="bg-gray-800 text-white">
        <footer>
          <p>&copy; 2024 PropChain</p>
        </footer>
      </ResponsiveContainer>
    </div>
  );
}
```

### Nested Containers

```tsx
<ResponsiveContainer className="bg-gray-50">
  <h2>Dashboard</h2>
  
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <ResponsiveContainer className="bg-white rounded-lg">
      <h3>Statistics</h3>
      <p>Total Properties: 42</p>
    </ResponsiveContainer>
    
    <ResponsiveContainer className="bg-white rounded-lg">
      <h3>Recent Activity</h3>
      <p>Last updated: 5 minutes ago</p>
    </ResponsiveContainer>
  </div>
</ResponsiveContainer>
```

## Best Practices

1. **Use for Page-Level Layouts**: Apply ResponsiveContainer to major page sections (header, main, footer)
2. **Combine with Tailwind**: Use className prop to add Tailwind utilities for additional styling
3. **Avoid Over-Nesting**: Too many nested containers can create excessive padding
4. **Choose the Right Variant**: Use default for distinct breakpoint designs, fluid for smooth transitions
5. **Test Across Viewports**: Always test your layouts at mobile, tablet, and desktop sizes

## Testing

The component includes comprehensive unit tests covering:
- Correct padding application for each viewport category
- Custom className support
- Horizontal overflow prevention
- Children rendering
- Both step-based and fluid variants

Run tests with:
```bash
npm test -- ResponsiveContainer.test.tsx
```

## Related Components

- **ViewportProvider**: Provides viewport context used by ResponsiveContainer
- **ResponsiveGrid**: Grid layout with responsive column counts
- **ResponsiveStack**: Stack layout that switches between row/column
- **ResponsiveText**: Typography with responsive font sizes

## Browser Support

- Modern browsers with CSS Grid and Flexbox support
- SSR-safe for Next.js server-side rendering
- Graceful degradation for older browsers

## Performance

- Minimal re-renders through memoized viewport context
- Debounced viewport updates (16ms = ~60fps)
- No JavaScript calculations for fluid variant (pure CSS)

## Accessibility

- No accessibility concerns (purely layout component)
- Maintains proper document structure
- Works with screen readers and keyboard navigation

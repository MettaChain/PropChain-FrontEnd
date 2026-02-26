# Viewport Provider

React Context provider for viewport state management with SSR support.

## Features

- **SSR-safe defaults**: Works seamlessly with Next.js server-side rendering
- **Client-side hydration**: Automatically updates with actual viewport dimensions on the client
- **ResizeObserver**: Uses ResizeObserver API for accurate viewport tracking (with fallback to resize events)
- **Memoized context**: Prevents unnecessary re-renders by memoizing the context value
- **Comprehensive viewport info**: Provides width, height, category, breakpoint, device type flags, and orientation

## Installation

The ViewportProvider is already set up in this project. To use it in your application:

### 1. Wrap your app with the provider

```tsx
// app/layout.tsx or _app.tsx
import { ViewportProvider } from '@/providers/ViewportProvider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ViewportProvider>
          {children}
        </ViewportProvider>
      </body>
    </html>
  );
}
```

### 2. Use the hook in your components

```tsx
import { useViewport } from '@/providers/ViewportProvider';

function MyComponent() {
  const { 
    width, 
    height, 
    category, 
    breakpoint, 
    isMobile, 
    isTablet, 
    isDesktop, 
    orientation 
  } = useViewport();

  return (
    <div>
      {isMobile ? (
        <MobileView />
      ) : isTablet ? (
        <TabletView />
      ) : (
        <DesktopView />
      )}
      
      <p>
        Viewport: {width}x{height}px
        <br />
        Category: {category}
        <br />
        Breakpoint: {breakpoint}
        <br />
        Orientation: {orientation}
      </p>
    </div>
  );
}
```

## API Reference

### ViewportContext Interface

```typescript
interface ViewportContext {
  width: number;              // Viewport width in pixels
  height: number;             // Viewport height in pixels
  category: ViewportCategory; // 'mobile' | 'tablet' | 'desktop'
  breakpoint: Breakpoint;     // 'sm' | 'md' | 'lg' | 'xl'
  isMobile: boolean;          // true if category is 'mobile'
  isTablet: boolean;          // true if category is 'tablet'
  isDesktop: boolean;         // true if category is 'desktop'
  orientation: 'portrait' | 'landscape'; // Device orientation
}
```

### Viewport Categories

- **mobile**: < 768px width
- **tablet**: 768px - 1023px width
- **desktop**: ≥ 1024px width

### Breakpoints

- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px

## Examples

### Conditional Rendering

```tsx
function Navigation() {
  const { isMobile } = useViewport();
  
  return isMobile ? <MobileNav /> : <DesktopNav />;
}
```

### Responsive Styling

```tsx
function Card() {
  const { breakpoint } = useViewport();
  
  const padding = {
    sm: '1rem',
    md: '1.5rem',
    lg: '2rem',
    xl: '2.5rem',
  }[breakpoint];
  
  return <div style={{ padding }}>{/* content */}</div>;
}
```

### Orientation-based Layout

```tsx
function Gallery() {
  const { orientation } = useViewport();
  
  return (
    <div className={orientation === 'landscape' ? 'grid-cols-3' : 'grid-cols-2'}>
      {/* images */}
    </div>
  );
}
```

### Width-based Logic

```tsx
function DataTable() {
  const { width } = useViewport();
  
  // Show card layout on narrow screens
  if (width < 640) {
    return <CardList data={data} />;
  }
  
  // Show table on wider screens
  return <Table data={data} />;
}
```

## Performance Considerations

- The provider uses **ResizeObserver** for efficient viewport tracking
- Updates are **debounced** to 16ms (~60fps) to prevent excessive re-renders
- Context value is **memoized** to prevent unnecessary re-renders of consuming components
- Only updates when viewport values actually change

## SSR Behavior

During server-side rendering:
- `width` and `height` default to `0`
- `category` defaults to `'mobile'` (mobile-first approach)
- `breakpoint` defaults to `'sm'`
- `isMobile` defaults to `true`
- `isTablet` and `isDesktop` default to `false`
- `orientation` defaults to `'portrait'`

These values are automatically updated on client-side hydration.

## Browser Support

- Modern browsers with ResizeObserver support (Chrome 64+, Firefox 69+, Safari 13.1+)
- Automatic fallback to `window.resize` event for older browsers
- SSR-safe for Next.js applications

## Related

- [Breakpoint Manager](../lib/breakpoints.ts) - Low-level breakpoint utilities
- [Mobile Detection](../utils/mobileDetection.ts) - User agent-based device detection

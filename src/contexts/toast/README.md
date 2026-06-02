# Global Toast Notification System

A centralized, type-safe, accessible notification infrastructure for the PropChain frontend application. Provides a consistent way to display transient user feedback (success, error, warning, and info messages) across all pages and components.

## Features

- **🎯 Type-Safe**: Full TypeScript support with compile-time validation
- **♿ Accessible**: WCAG 2.1 AA compliant with screen reader support
- **📱 Responsive**: Mobile-optimized with swipe-to-dismiss and touch-friendly targets
- **🎨 Customizable**: Configurable defaults and per-toast overrides
- **🔄 Auto-dismiss**: Configurable auto-dismiss with pause-on-hover
- **⚡ Performance**: Optimized re-renders with React Context memoization
- **🧪 Testable**: Mock provider for easy testing without rendering real toasts
- **🎭 Lightweight**: < 3KB bundle size (excludes Sonner)

## Installation

The toast system is already integrated into the PropChain frontend. No additional installation needed.

## Quick Start

### Setup (Already done in root layout)

```typescript
// app/layout.tsx
import { ToastProvider } from '@/contexts/toast';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider 
      defaultDuration={5000}
      maxToasts={10}
    >
      {children}
    </ToastProvider>
  );
}
```

### Basic Usage

```typescript
'use client';

import { useToast } from '@/contexts/toast';

export function MyComponent() {
  const toast = useToast();

  const handleSuccess = () => {
    toast.success('Operation completed successfully!');
  };

  const handleError = () => {
    toast.error('An error occurred');
  };

  return (
    <div>
      <button onClick={handleSuccess}>Show Success</button>
      <button onClick={handleError}>Show Error</button>
    </div>
  );
}
```

## API Reference

### useToast Hook

Returns methods to display toast notifications.

```typescript
const toast = useToast();
```

#### Methods

##### `success(message: string, options?: ToastOptions): string`

Display a success notification.

```typescript
toast.success('Changes saved!');
const toastId = toast.success('Item created', { duration: 3000 });
```

##### `error(message: string, options?: ToastOptions): string`

Display an error notification.

```typescript
toast.error('Something went wrong');
toast.error('Invalid input', { duration: 7000 });
```

##### `warning(message: string, options?: ToastOptions): string`

Display a warning notification.

```typescript
toast.warning('This action cannot be undone');
```

##### `info(message: string, options?: ToastOptions): string`

Display an info notification.

```typescript
toast.info('New update available');
```

##### `toast(config: Omit<Toast, 'id'>): string`

Display a toast with custom configuration (advanced usage).

```typescript
toast.toast({
  type: 'success',
  message: 'Custom toast',
  duration: 0, // Persistent
  position: 'bottom-center',
});
```

### Toast Options

Configure toast behavior with optional parameters:

```typescript
interface ToastOptions {
  duration?: number;           // Auto-dismiss duration in ms (0 = persistent)
  position?: ToastPosition;    // 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
  action?: {                   // Optional action button
    label: string;
    onClick: () => void | Promise<void>;
    icon?: React.ReactNode;
  };
  onClose?: () => void;        // Callback when dismissed
  dismissible?: boolean;       // Show close button (default: true)
}
```

### ToastProvider Props

```typescript
interface ToastProviderProps {
  children: React.ReactNode;
  defaultDuration?: number;      // Default: 5000ms
  defaultPosition?: ToastPosition; // Default: 'top-right' (desktop) / 'bottom-center' (mobile)
  maxToasts?: number;            // Default: 10
}
```

## Common Usage Patterns

### Success Toast with Duration

```typescript
const handleSave = async () => {
  try {
    await api.save(data);
    toast.success('Saved successfully!', { duration: 3000 });
  } catch (error) {
    toast.error('Failed to save');
  }
};
```

### Error Toast with Action

```typescript
const handleDelete = async () => {
  try {
    await api.delete(id);
  } catch (error) {
    toast.error('Delete failed', {
      action: {
        label: 'Retry',
        onClick: () => handleDelete(),
      },
    });
  }
};
```

### Warning Toast with Custom Position

```typescript
toast.warning('This action is permanent', {
  position: 'bottom-center',
  duration: 0, // Persistent until manually dismissed
});
```

### Info Toast with Callback

```typescript
toast.info('Check email for verification link', {
  onClose: () => {
    // Handle toast dismissal
    console.log('Toast dismissed');
  },
});
```

### Persistent Toast (No Auto-Dismiss)

```typescript
const toastId = toast.toast({
  type: 'warning',
  message: 'Critical alert that requires acknowledgment',
  duration: 0, // Will not auto-dismiss
  dismissible: true, // User can manually close
});
```

## Error Handling Integration

The toast system integrates with the application's error handling infrastructure (ADR-005).

### Using showErrorToast

```typescript
import { showErrorToast } from '@/contexts/toast';

const handleTransaction = async () => {
  try {
    await submitTransaction(data);
  } catch (error) {
    // Automatically extracts user-friendly message
    showErrorToast(error);
  }
};
```

### Error Types Supported

Works with all error types defined in `src/utils/errors.ts`:

- `BlockchainError`
- `NetworkError`
- `ValidationError`
- `AppError`
- Generic `Error` objects

### Example: Blockchain Error

```typescript
try {
  await sendTransaction();
} catch (error) {
  // If error is: BlockchainError with code 'USER_REJECTED'
  // Toast will show: "User rejected the transaction"
  // Error code logged separately for debugging
  showErrorToast(error);
}
```

## Mobile Behavior

The toast system automatically adapts to mobile devices:

- **Position**: Defaults to `bottom-center` on mobile (< 768px width)
- **Size**: 100% width with padding, text wrapping enabled
- **Touch Target**: Close button is 44x44px minimum for WCAG compliance
- **Gesture**: Supports swipe-up or swipe-left to dismiss
- **Stacking**: Reduced vertical spacing on small screens

### Mobile Example

```typescript
// This will automatically display at bottom-center on mobile
toast.success('Message sent', { 
  position: 'bottom-center' // Optional (auto-detected on mobile)
});
```

## Accessibility (WCAG 2.1 AA)

### Screen Reader Support

Toasts are automatically announced to screen readers:

- **Urgent notifications** (error, warning): Announced immediately with `aria-live="assertive"`
- **Regular notifications** (success, info): Announced when convenient with `aria-live="polite"`

### Keyboard Navigation

- **Tab**: Navigate to action buttons and close buttons
- **Escape**: Dismiss focused toast
- **Enter/Space**: Activate action button

### Visual Accessibility

- **Color + Icon**: Toast variants use both color and icons (not color alone)
- **Contrast**: Meets WCAG AA color contrast requirements
- **Focus**: Clear focus indicators on buttons
- **Reduced Motion**: Respects `prefers-reduced-motion` preference

## Testing

### Using MockToastProvider

Use the `MockToastProvider` in tests to capture toasts without rendering:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { MockToastProvider } from '@/contexts/toast/__mocks__/MockToastProvider';
import { useToast } from '@/contexts/toast';

function TestComponent() {
  const toast = useToast();
  return <button onClick={() => toast.success('Done!')}>Show</button>;
}

it('should show success toast', () => {
  render(
    <MockToastProvider>
      <TestComponent />
    </MockToastProvider>
  );

  fireEvent.click(screen.getByText('Show'));

  // Assert on captured toasts
  expect(MockToastProvider.__toasts).toHaveLength(1);
  expect(MockToastProvider.__toasts[0]).toEqual(
    expect.objectContaining({ type: 'success', message: 'Done!' })
  );

  // Clean up
  MockToastProvider.__reset();
});
```

### Test Cleanup

Always reset the mock provider in `afterEach`:

```typescript
afterEach(() => {
  MockToastProvider.__reset();
});
```

## When NOT to Use Toasts

Do NOT use the toast system for:

- **Critical Errors**: Use error boundaries or dialogs for errors that break the app
- **Confirmations**: Use modals/dialogs for operations requiring user confirmation
- **Forms**: Use inline validation messages within the form
- **Persistent Data**: Toasts are transient; use a dedicated notification panel for persistent messages

## Examples

### Transaction Success

```typescript
async function submitTransaction() {
  const toast = useToast();
  
  try {
    const receipt = await sendTransaction();
    toast.success(`Transaction confirmed: ${receipt.hash}`, {
      duration: 5000,
      action: {
        label: 'View',
        onClick: () => window.open(`/explorer/tx/${receipt.hash}`),
      },
    });
  } catch (error) {
    showErrorToast(error);
  }
}
```

### Form Validation

```typescript
function ContactForm() {
  const toast = useToast();

  const handleSubmit = async (data) => {
    if (!data.email) {
      toast.warning('Please enter an email address');
      return;
    }
    
    try {
      await submitForm(data);
      toast.success('Thank you! We'll be in touch soon.');
    } catch (error) {
      showErrorToast(error);
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Data Loading State

```typescript
function DataFetcher() {
  const toast = useToast();
  const [data, setData] = React.useState(null);

  const fetch = async () => {
    try {
      const response = await fetchData();
      setData(response);
      toast.info('Data loaded successfully');
    } catch (error) {
      toast.error('Failed to load data', {
        action: {
          label: 'Retry',
          onClick: fetch,
        },
      });
    }
  };

  return <button onClick={fetch}>Fetch Data</button>;
}
```

## Configuration

### Global Defaults

Set defaults when initializing the provider:

```typescript
<ToastProvider
  defaultDuration={4000}         // 4 seconds instead of 5
  defaultPosition="bottom-right" // Always at bottom-right
  maxToasts={5}                  // Show max 5 toasts
>
  {children}
</ToastProvider>
```

### Per-Toast Overrides

Override defaults for specific toasts:

```typescript
// Override duration
toast.success('Saved', { duration: 2000 }); // 2 seconds instead of default 4

// Override position
toast.info('New message', { position: 'top-center' });

// Combine overrides
toast.warning('Important', {
  duration: 0,         // Persistent
  position: 'top-left',
  dismissible: true,
});
```

## Performance Considerations

- **Max Toasts**: Limited to 10 active toasts (configurable). Older toasts auto-removed.
- **Memory**: ~200 bytes per toast, max ~2KB for 10 toasts
- **Re-renders**: Context memoized to prevent unnecessary component re-renders
- **Display Latency**: Toast appears within 100ms of being triggered
- **Bundle Size**: Toast system + Sonner < 15KB gzipped

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile Safari on iOS 13+
- Chrome Android 90+

## Troubleshooting

### Toast Not Appearing

1. **Verify Provider**: Check that `ToastProvider` wraps your component
2. **Check Client Component**: Ensure component has `'use client'` directive
3. **Verify useToast Hook**: Confirm hook is called inside provider

```typescript
'use client'; // Required!

import { useToast } from '@/contexts/toast';

export function MyComponent() {
  const toast = useToast(); // Must be inside component wrapped by provider
  
  return <button onClick={() => toast.success('Test')}>Show</button>;
}
```

### Multiple Providers

If using with other providers (React Query, ThemeProvider), wrap ToastProvider inside them:

```typescript
<QueryClientProvider client={queryClient}>
  <ThemeProvider>
    <ToastProvider>
      {children}
    </ToastProvider>
  </ThemeProvider>
</QueryClientProvider>
```

### TypeScript Errors

If TypeScript complains about `useToast` type:

```typescript
// ✅ Correct
import { useToast } from '@/contexts/toast';
const toast = useToast();

// ❌ Incorrect
import { ToastContext } from '@/contexts/toast/context';
const toast = useContext(ToastContext); // May not have full types
```

## Related Documentation

- [Error Handling (ADR-005)](docs/adr/ADR-005-error-handling.md)
- [Type Guards and Error Utilities](src/utils/typeGuards.ts)
- [Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## Support

For issues or questions:

1. Check the examples above
2. Review the type definitions in `src/contexts/toast/types/index.ts`
3. Check existing tests for usage patterns
4. Open an issue in the project repository

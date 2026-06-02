# Global Toast Notification System - Design Document

## Overview

The Global Toast Notification System is a centralized, React Context-based notification infrastructure built on the Sonner library. It provides a type-safe, developer-friendly API for displaying transient user feedback (success, error, warning, info) across the PropChain Next.js 16+ application.

This design establishes:
- **Architecture**: Context-based provider with memoization and queue management
- **API Design**: Hook-based interface (`useToast()`) with intuitive method names
- **Integration**: Seamless integration with existing error handling (ADR-005) and TypeScript utilities
- **Accessibility**: WCAG 2.1 AA compliance with aria-live announcements and keyboard navigation
- **Performance**: Memory-efficient queue management (max 10 toasts) and optimized re-renders
- **Type Safety**: Comprehensive TypeScript types and compile-time validation

---

## Architecture

### High-Level System Design

```
┌─────────────────────────────────────────────────────────┐
│                    Root Layout (SSR)                     │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │              ToastProvider                         │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │        Toast Context (Memoized Value)       │ │ │
│  │  │  ├─ queue: Toast[]                          │ │ │
│  │  │  ├─ addToast: (toast) => void               │ │ │
│  │  │  ├─ removeToast: (id) => void               │ │ │
│  │  │  ├─ clearToasts: () => void                 │ │ │
│  │  │  └─ config: ToastProviderConfig             │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                   │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │     Sonner Toaster Component (Renderer)     │ │ │
│  │  │  - Handles rendering from queue             │ │ │
│  │  │  - Manages positioning (top/bottom)         │ │ │
│  │  │  - Controls auto-dismiss timers             │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │           Child Components                         │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │  Component A                                 │ │ │
│  │  │  useToast() → success(), error(), etc.      │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │  Component B                                 │ │ │
│  │  │  useToast() → toast({ type, message, ... }) │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

```
Component calls:
  useToast().success("Operation completed!")
    │
    ├─→ Hook returns toast methods from Context
    │
    ├─→ success() method triggers:
    │    ├─ Generate unique toast ID
    │    ├─ Create Toast object (type='success', message, etc.)
    │    ├─ Call context.addToast(toast)
    │
    ├─→ addToast updates Context state:
    │    ├─ Check queue size (enforce max 10)
    │    ├─ If max reached, remove oldest toast
    │    ├─ Add new toast to queue
    │    ├─ Trigger re-render (only in Provider scope)
    │
    ├─→ Sonner Toaster receives updated queue:
    │    ├─ Render toast with Sonner's toast() API
    │    ├─ Set aria-live region based on type (polite/assertive)
    │    ├─ Configure auto-dismiss timer (default 5s)
    │    ├─ Setup event listeners (hover, close, action)
    │
    └─→ Toast displayed on screen
       ├─ Auto-dismisses after configured duration
       └─ Removed from queue on dismiss or manual close
```

### Data Flow: Context-Based State Management

1. **Initialization**: Provider mounts with empty queue and default config
2. **Add Toast**: Component triggers toast → added to queue → context updated → Sonner renders
3. **User Interaction**: Hover/close/action → event handler fires → toast removed → queue updated
4. **Auto-Dismiss**: Timer expires → callback removes toast → context updated → DOM updated

---

## Components and Interfaces

### ToastProvider Component

**Purpose**: Root-level provider that manages toast state and provides context to all children.

**Props**:
```typescript
interface ToastProviderProps {
  children: React.ReactNode;
  defaultDuration?: number;      // Default: 5000ms
  defaultPosition?: ToastPosition; // Default: 'top-right'
  maxToasts?: number;             // Default: 10
}
```

**Implementation Notes**:
- Uses `'use client'` directive for Next.js App Router
- Wraps context value in `React.memo()` to prevent unnecessary re-renders
- Initializes Sonner Toaster with position and theme configuration
- Handles SSR by avoiding hydration mismatches (no dynamic positioning until client-side)

**Key Methods**:
- `addToast(toast)`: Adds toast to queue, enforces max limit
- `removeToast(id)`: Removes toast by ID
- `clearToasts()`: Clears all toasts (useful for cleanup)

### useToast Hook

**Purpose**: Provides type-safe methods to trigger toast notifications from any component within the Provider.

**Returns**:
```typescript
interface UseToastReturn {
  success: (message: string, options?: ToastOptions) => string; // Returns toast ID
  error: (message: string, options?: ToastOptions) => string;
  warning: (message: string, options?: ToastOptions) => string;
  info: (message: string, options?: ToastOptions) => string;
  toast: (toast: Toast) => string; // Generic method for advanced usage
}
```

**Key Features**:
- Type-safe parameter validation
- Auto-generates unique toast IDs (using nanoid for performance)
- Throws clear error if used outside Provider
- Supports optional configuration overrides
- Returns toast ID for programmatic removal if needed

### Type Definitions and Interfaces

```typescript
// Core Toast Type
type ToastVariant = 'success' | 'error' | 'warning' | 'info';

type ToastPosition = 
  | 'top-left' 
  | 'top-center' 
  | 'top-right' 
  | 'bottom-left' 
  | 'bottom-center' 
  | 'bottom-right';

interface Toast {
  id: string;
  type: ToastVariant;
  message: string;
  duration?: number;           // milliseconds, 0 = persistent
  position?: ToastPosition;
  action?: {
    label: string;
    onClick: () => void | Promise<void>;
    icon?: React.ReactNode;
  };
  onClose?: () => void;       // Callback when toast is dismissed
  dismissible?: boolean;       // Show close button, default true
}

interface ToastOptions {
  duration?: number;
  position?: ToastPosition;
  action?: Toast['action'];
  onClose?: () => void;
  dismissible?: boolean;
}

interface ToastContextType {
  queue: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  config: ToastProviderConfig;
}

interface ToastProviderConfig {
  defaultDuration: number;
  defaultPosition: ToastPosition;
  maxToasts: number;
}
```

---

## Integration with Error Handling (ADR-005)

### Error Toast Utility Function

The system provides a utility to integrate with the existing error handling infrastructure:

```typescript
// src/contexts/toast/utils/errorToast.ts

export function showErrorToast(error: unknown, options?: ToastOptions): string {
  const message = getErrorMessage(error, 'An error occurred');
  const errorCode = getErrorCode(error);
  
  // Log error code and sensitive details to console (dev) or Sentry (prod)
  if (process.env.NODE_ENV === 'development') {
    console.error('[Toast Error]', { errorCode, error });
  } else {
    // In production, sensitive details go to Sentry
    reportErrorToSentry(error);
  }
  
  return useToast().error(message, options);
}
```

**Integration Points**:
- Uses `getErrorMessage()` from `src/utils/typeGuards.ts` to extract user-friendly messages
- Uses `getErrorCode()` to identify specific error types
- Compatible with `AppError` interface from `src/types/errors.ts`
- Logs sensitive details separately (never in toast message)

---

## Data Models

### Toast Queue Management

**Queue Storage**: React Context state
- Stored as array of Toast objects
- Maximum capacity: 10 (configurable via provider props)
- When capacity exceeded: oldest toast is removed (FIFO)

**Queue Operations**:
- `add`: O(1) - push to array and check length
- `remove`: O(n) - filter by ID
- `clear`: O(1) - reset to empty array

**Memory Efficiency**:
- Each toast ~200 bytes (ID + strings + config)
- Max 10 toasts ≈ 2KB memory overhead
- Event listeners cleaned up on toast removal
- No memory leaks from timer accumulation (Sonner handles cleanup)

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Hook Returns Consistent Interface

*For any* component nested at any depth within the ToastProvider, calling `useToast()` should return the same method signatures (success, error, warning, info, toast) regardless of nesting depth.

**Validates: Requirement 2.2**

### Property 2: Configuration Options Override Provider Defaults

*For any* custom configuration provided to a toast call (duration, position, action), those options should override the provider's default configuration for that specific toast only.

**Validates: Requirement 14.3**

### Property 3: Auto-Dismiss Respects Custom Duration

*For any* non-zero duration specified in toast options (in milliseconds), the toast should be dismissed after approximately that duration (within reasonable timing variance for JavaScript timers).

**Validates: Requirement 4.2**

### Property 4: Queue Never Exceeds Maximum

*For any* sequence of toast additions, the number of active toasts in the queue should never exceed the configured maximum (default 10), even when more toasts are triggered simultaneously.

**Validates: Requirement 11.1**

### Property 5: Multiple Toast Variants Display Without Interference

*For any* combination of toast variants (success, error, warning, info) displayed simultaneously, each toast should render with its correct variant styling and icon without affecting other toasts' appearance or behavior.

**Validates: Requirement 3.2**

### Property 6: Error Message Extraction Preserves Intent

*For any* error object passed to `showErrorToast()`, the extracted error message should be a non-empty string that conveys the error intent without exposing sensitive technical details (no stack traces, API keys, or system internals).

**Validates: Requirement 6.2, 6.5**

### Property 7: Aria-Live Attributes Match Toast Type

*For any* toast displayed, the aria-live attribute should be set to "polite" for success/info toasts and "assertive" for error/warning toasts, ensuring proper screen reader announcement priority.

**Validates: Requirement 8.2, 8.3**

### Property 8: Multiple Toasts Stack Vertically

*For any* multiple toasts displayed at the same position, each toast should render at a different vertical position without overlapping with other toasts in the same position stack.

**Validates: Requirement 5.4**

### Property 9: Persistent Toasts (Duration 0) Don't Auto-Dismiss

*For any* toast created with duration 0 or null, the toast should remain visible until manually dismissed by the user clicking the close button, regardless of time elapsed.

**Validates: Requirement 4.3**

### Property 10: Supported Positions Match Specification

*For any* position value from the supported set (top-left, top-center, top-right, bottom-left, bottom-center, bottom-right), toasts should render at that position when specified in options.

**Validates: Requirement 10.1, 10.2**

---

## Error Handling

### Error Boundaries and Fallback Behavior

1. **Provider Initialization Errors**:
   - If ToastProvider fails to initialize: Render children without provider (toasts unavailable but app functional)
   - Log error to console/Sentry
   - Display warning in development

2. **Hook Outside Provider**:
   - Throws clear error: "useToast must be used within a ToastProvider"
   - Error message includes troubleshooting steps in development

3. **Toast Action Callback Errors**:
   - Catch errors in action onClick handlers
   - Display error toast without crashing app
   - Log callback error separately for debugging

4. **Sonner Rendering Failures**:
   - Wrapped in try-catch block
   - Log error to Sentry (production) or console (development)
   - Don't crash application—toast system degrades gracefully

5. **Memory or Queue Errors**:
   - Queue automatically enforces max limit (FIFO removal)
   - No error thrown—old toasts removed transparently

### Integration with ADR-005 Error Handling

The toast system integrates with application-wide error handling:
- Error toasts display through `showErrorToast(error)` utility
- User-friendly messages from `getErrorMessage()`
- Sensitive details logged separately via `reportErrorToSentry()`
- Error codes captured for debugging and analytics

---

## Accessibility Implementation (WCAG 2.1 AA)

### Screen Reader Support

- **aria-live Regions**: Each toast is wrapped in aria-live region
  - `aria-live="polite"` for success/info (non-urgent)
  - `aria-live="assertive"` for error/warning (urgent)
- **aria-label**: Action buttons have descriptive labels
- **Roles**: Toasts use `role="alert"` for error/warning variants

### Keyboard Navigation

- **Escape Key**: Dismisses currently focused toast
- **Tab Navigation**: Users can tab to action buttons and close buttons
- **Focus Management**: Focus does not return to dismissed toasts
- **No Keyboard Trap**: Toasts don't prevent keyboard navigation to other elements

### Visual Accessibility

- **Color**: Toast variants use color + icon (not color alone)
- **Icons**: Clear, recognizable icons for each variant
- **Contrast**: Text contrast meets WCAG AA standards
- **Font Size**: Readable on all device sizes

### Touch Accessibility

- **Touch Target Size**: Close button minimum 44x44 pixels (WCAG requirement)
- **Swipe Dismiss**: Support for swipe-up/swipe-left on touch devices
- **Mobile Positioning**: Bottom-center by default on mobile for easier reach

---

## Performance Optimization Approaches

### Render Optimization

1. **Context Memoization**:
   - Wrap context value in `React.useMemo()`
   - Only update when queue or config actually changes
   - Prevents unnecessary re-renders of all consuming components

2. **Provider-Level Re-renders**:
   - Only ToastProvider re-renders when queue changes
   - Child components don't re-render unless they call useToast()
   - Sonner Toaster is the only renderer, isolated from context re-renders

3. **Component Isolation**:
   - Toast rendering handled entirely by Sonner
   - No custom render loop for individual toasts
   - Each toast rendered as independent Sonner toast

### Memory Optimization

1. **Queue Limits**:
   - Maximum 10 active toasts (configurable)
   - Older toasts auto-removed when limit reached
   - Total memory footprint < 2KB for max queue

2. **Event Listener Cleanup**:
   - All timers cleared on toast removal
   - Event listeners removed in Sonner cleanup
   - No accumulation of memory-leaking listeners

3. **ID Generation**:
   - Use `nanoid(6)` for compact, collision-free IDs
   - Shorter than UUID but still unique enough
   - Reduces string memory overhead

### Display Performance

1. **Auto-dismiss Timing**:
   - Default 5s (5000ms) balances visibility with clutter
   - Configurable per toast and provider-wide
   - Pause on hover to prevent accidental dismissal during read

2. **CSS Positioning**:
   - Use CSS transforms for smooth animations
   - Avoid layout recalculation on stack changes
   - GPU-accelerated transitions via Sonner

3. **Bundle Size Impact**:
   - Context + Hook + Utilities: ~3KB (uncompressed)
   - Sonner library already in dependencies: ~15KB
   - Total impact on app bundle: negligible

---

## Testing Strategy

### Property-Based Testing (Applicable)

This feature is suitable for property-based testing because:
- Core logic is pure functions (toast creation, queue management, configuration)
- Universal properties hold across wide input ranges (variants, durations, positions)
- Input variation reveals edge cases (max queue, timing, configuration overrides)

**Properties to Test** (see Correctness Properties section):
1. Hook interface consistency across nesting depths
2. Configuration options override provider defaults
3. Auto-dismiss duration respected
4. Queue never exceeds maximum
5. Multiple variants render without interference
6. Error message extraction preserves intent
7. Aria-live attributes match toast type
8. Multiple toasts stack vertically
9. Persistent toasts (duration 0) don't auto-dismiss
10. Supported positions render correctly

**PBT Configuration**:
- Minimum 100 iterations per property test
- Generators for: toast variants, durations (0-30000ms), positions, error objects
- Edge cases: empty strings, null values, max queue triggers, rapid succession adds
- Tag format: `Feature: global-toast-notification-system, Property {N}: {description}`

### Unit Testing

**Test Coverage**:
- Hook initialization and error handling
- Toast creation with various option combinations
- Queue management (add, remove, clear, max enforcement)
- Error message extraction from different error types
- ARIA attribute verification

**Test Scenarios**:
- ✅ useToast() returns all expected methods
- ✅ useToast() throws outside provider
- ✅ Toast with custom duration auto-dismisses at correct time
- ✅ Queue enforces maximum (10 toasts)
- ✅ Error toast extracts message from AppError
- ✅ Persistent toast (duration 0) doesn't auto-dismiss
- ✅ Action button callback executes on click
- ✅ Close button removes toast immediately

### Integration Testing

**Test Coverage**:
- Toast system with Next.js SSR (no hydration mismatches)
- Toast system with multiple providers (composition)
- Toast system with error boundary error handling
- Toast persistence across route navigation
- Toast system in Error Boundary with error recovery

**Test Scenarios**:
- ✅ Provider wraps app without hydration errors
- ✅ ToastProvider composes with QueryProvider, ThemeProvider
- ✅ Toasts persist when navigating between routes
- ✅ Error boundary can trigger error toasts on recovery

### Accessibility Testing

**Manual Testing**:
- Screen reader announcement (NVDA, JAWS, VoiceOver)
- Keyboard navigation (Tab, Escape, arrow keys)
- Touch interaction (swipe to dismiss)

**Automated Accessibility Testing**:
- ARIA attributes present and correct
- Color contrast meets WCAG AA (tested via jest-axe)
- Touch targets sized correctly (44x44 minimum)
- Focus management correct after dismissal

### Mock Provider for Testing

```typescript
// src/contexts/toast/__mocks__/MockToastProvider.tsx

interface MockToastContextType extends ToastContextType {
  __toasts: Toast[]; // Exposed for test assertions
  __reset: () => void;
}

export function MockToastProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = React.useState<Toast[]>([]);
  
  const value: MockToastContextType = {
    queue,
    addToast: (toast) => {
      const id = nanoid();
      setQueue(prev => [...prev, { ...toast, id }]);
      return id;
    },
    removeToast: (id) => {
      setQueue(prev => prev.filter(t => t.id !== id));
    },
    clearToasts: () => setQueue([]),
    config: { defaultDuration: 5000, defaultPosition: 'top-right', maxToasts: 10 },
    __toasts: queue,
    __reset: () => setQueue([]),
  };
  
  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
}

// Usage in tests:
// const { rerender } = render(
//   <MockToastProvider>
//     <YourComponent />
//   </MockToastProvider>
// );
// const toast = useToast();
// toast.success('Test');
// expect(toast.__toasts).toContainEqual(expect.objectContaining({ type: 'success' }));
```

---

## File Structure and Module Organization

```
src/
├── contexts/
│   └── toast/
│       ├── __tests__/
│       │   ├── ToastProvider.test.tsx
│       │   ├── useToast.test.tsx
│       │   ├── errorToast.test.ts
│       │   └── properties.test.ts (property-based tests)
│       │
│       ├── __mocks__/
│       │   ├── MockToastProvider.tsx
│       │   └── __tests__/
│       │       └── MockToastProvider.test.tsx
│       │
│       ├── components/
│       │   └── ToastProvider.tsx (main provider component)
│       │
│       ├── hooks/
│       │   └── useToast.ts (main hook)
│       │
│       ├── types/
│       │   └── index.ts (Toast, ToastOptions, etc.)
│       │
│       ├── utils/
│       │   ├── errorToast.ts (showErrorToast utility)
│       │   ├── queueManager.ts (queue operations)
│       │   └── validators.ts (input validation)
│       │
│       ├── context.ts (ToastContext definition)
│       ├── constants.ts (defaults, durations, positions)
│       └── index.ts (exports)
│
└── [existing error handling files]
    ├── types/errors.ts
    ├── utils/typeGuards.ts
    └── [error boundary components]
```

### Key Exports (src/contexts/toast/index.ts)

```typescript
// Components
export { ToastProvider } from './components/ToastProvider';
export { MockToastProvider } from './__mocks__/MockToastProvider';

// Hooks
export { useToast } from './hooks/useToast';

// Types
export type {
  Toast,
  ToastVariant,
  ToastPosition,
  ToastOptions,
  ToastContextType,
  ToastProviderProps,
  UseToastReturn,
} from './types';

// Utilities
export { showErrorToast } from './utils/errorToast';

// Constants
export { TOAST_POSITIONS, TOAST_VARIANTS, DEFAULT_DURATION } from './constants';
```

---

## Implementation Considerations

### Next.js App Router Compatibility

- **Server vs Client**: Provider is client component ('use client'), works with SSR
- **Hydration**: No dynamic positioning on server; computed client-side
- **Root Layout**: Wrap provider in root layout (app/layout.tsx) above all route groups

### Sonner Library Integration

- **Version**: Compatible with sonner@2.x (already in package.json)
- **Toast API**: Use Sonner's `toast()` function internally, expose through useToast
- **Positioning**: Sonner handles rendering and positioning, provider manages queue
- **Theme**: Respect Tailwind dark mode through Sonner's theme prop

### TypeScript Strictness

- Full `--strict` mode compliance
- No `any` types; all generic constraints properly defined
- Discriminated unions for Toast variants
- Type predicates for error type checks

### SSR Considerations

- Provider logic is safe for SSR (no browser APIs in provider initialization)
- Sonner Toaster rendered only on client (no server-side rendering of actual toasts)
- Context hydration safe: server renders empty queue, client hydrates
- No hydration mismatches: client-side computation matches server markup

---

## Next Steps

This design document establishes the architecture, interfaces, and testing strategy for the Global Toast Notification System. The implementation phase will:

1. Create the ToastProvider component with Context setup
2. Implement the useToast hook with error handling
3. Develop error integration utilities
4. Set up Sonner integration
5. Write comprehensive property-based tests
6. Create accessibility tests and keyboard interaction handlers
7. Develop mock provider for testing
8. Write documentation and JSDoc comments
9. Integrate with existing error handling (ADR-005)
10. Run full test suite and accessibility audit


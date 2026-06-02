# Global Toast Notification System - Requirements Document

## Introduction

The Global Toast Notification System is a centralized, reusable notification infrastructure for the PropChain frontend application. It provides a consistent, accessible way to display transient user feedback (success, error, warning, and info messages) across all pages and components. The system integrates with the project's existing error handling strategy (ADR-005) and leverages the Sonner library for rendering while providing a type-safe, context-based API for developers.

This system ensures that users receive timely, meaningful feedback for all application actions—from successful transactions to network failures—while maintaining accessibility standards and allowing fine-grained control over notification behavior.

---

## Glossary

- **Toast Notification**: A short-lived, non-blocking notification message displayed to the user, automatically dismissed after a configurable duration or manually by the user.
- **Toast Provider**: A React Context Provider component that manages the global state of all active toasts and provides methods to display new notifications.
- **useToast Hook**: A React hook that allows components to trigger notifications without direct DOM manipulation or prop drilling.
- **Toast Variant**: The visual type/severity of a toast: 'success', 'error', 'warning', or 'info'.
- **Auto-dismiss**: The automatic removal of a toast notification after a specified duration.
- **Accessible (WCAG 2.1 AA)**: Compliant with Web Content Accessibility Guidelines, ensuring screen readers announce notifications and keyboard navigation is supported.
- **Server Component**: A React component that runs on the server in Next.js 16+ with the App Router.
- **Client Component**: A React component marked with 'use client' directive and runs in the browser.
- **ToastConfig**: An object containing display options for a toast (position, duration, action button, etc.).
- **PropChain Frontend**: The Next.js/TypeScript application for the MettaChain/PropChain property management platform.
- **Error Boundary**: A React error boundary component that catches rendering errors and displays fallback UI.

---

## Requirements

### Requirement 1: Toast Provider Setup and Context

**User Story:** As a developer, I want a centralized provider that manages toast state so that I can display notifications globally without prop drilling or component-level state management.

#### Acceptance Criteria

1. THE ToastProvider SHALL wrap the application at the root level (in the root layout or _app.tsx equivalent).
2. WHEN the ToastProvider is mounted, THE Context SHALL be initialized with an empty toast queue.
3. THE ToastProvider SHALL export a TypeScript interface defining the toast structure (type, message, duration, etc.).
4. WHERE the application requires multiple providers (e.g., QueryProvider, ThemeProvider), THE ToastProvider SHALL compose cleanly with existing providers without causing hydration mismatches.
5. WHILE the application is running, THE ToastProvider SHALL remain in memory and accessible to all child components.
6. THE ToastProvider SHALL prevent unnecessary re-renders by memoizing the context value.

---

### Requirement 2: useToast Hook Implementation

**User Story:** As a developer, I want a simple hook to trigger toasts from any component so that I can display notifications without importing multiple utilities or writing boilerplate code.

#### Acceptance Criteria

1. THE useToast hook SHALL return an object with methods to display toasts: `success()`, `error()`, `warning()`, `info()`, and `toast()` (generic).
2. WHEN a component calls `useToast()`, THE hook SHALL return the same methods regardless of component nesting depth.
3. WHEN `useToast()` is called outside the ToastProvider, THE hook SHALL throw a clear error message: "useToast must be called within a ToastProvider".
4. WHEN a developer calls `toast({ type: 'success', message: 'Saved!' })`, THE Toast System SHALL display a success notification.
5. THE useToast hook SHALL support optional configuration: duration (milliseconds), position ('top' | 'bottom'), and action button (label + onClick).
6. WHERE a component is a Server Component, THE useToast hook SHALL NOT be used (TypeScript error or documentation warning).

---

### Requirement 3: Toast Display and Rendering

**User Story:** As a user, I want notifications to appear prominently on screen and disappear automatically so that I stay informed of application events without manual dismissal.

#### Acceptance Criteria

1. WHEN a toast is triggered, THE Toast System SHALL render it using the Sonner library.
2. THE Toast System SHALL support four toast variants: 'success' (green), 'error' (red), 'warning' (yellow), 'info' (blue).
3. WHEN a toast is displayed, THE Toast System SHALL render an icon corresponding to the variant (checkmark for success, X for error, warning sign, info icon).
4. WHEN a toast message exceeds the viewport width on mobile devices, THE Toast System SHALL wrap text and maintain readability.
5. THE Toast System SHALL display toasts with a default duration of 5000 milliseconds (5 seconds).
6. WHEN a user hovers over a toast, THE Toast System SHALL pause the auto-dismiss timer.
7. WHEN a user clicks the close button on a toast, THE Toast System SHALL remove the toast immediately.
8. WHILE a toast is displayed, THE Toast System SHALL not block user interaction with other page elements (non-modal behavior).

---

### Requirement 4: Auto-dismiss Functionality

**User Story:** As a user, I want notifications to disappear automatically after a short duration so that the screen remains uncluttered.

#### Acceptance Criteria

1. WHEN a toast is created with the default configuration, THE Toast System SHALL auto-dismiss after 5 seconds.
2. WHERE a developer specifies a custom duration in the toast options, THE Toast System SHALL auto-dismiss after the specified duration (in milliseconds).
3. IF a duration is set to 0 or null, THEN THE Toast System SHALL NOT auto-dismiss the toast (persistent notification).
4. WHEN a toast is about to auto-dismiss, THE Toast System SHALL provide a visual countdown or fade effect.
5. WHEN a user moves the mouse over a toast, THE Toast System SHALL pause the auto-dismiss countdown.
6. WHEN the mouse leaves the toast, THE Toast System SHALL resume the auto-dismiss countdown.

---

### Requirement 5: Toast Actions and Interactions

**User Story:** As a developer, I want to add action buttons to toasts so that users can respond to notifications without navigating away.

#### Acceptance Criteria

1. WHERE a developer includes an `action` property in toast options, THE Toast System SHALL render an action button with the specified label and icon.
2. WHEN a user clicks the action button, THE Toast System SHALL execute the provided callback function.
3. WHEN an action callback is executed, THE Toast System SHALL automatically dismiss the toast after 500ms (allowing UI feedback).
4. THE Toast System SHALL support multiple toasts displayed simultaneously without interference.
5. WHEN the viewport contains multiple toasts, THE Toast System SHALL stack them vertically without overlap.

---

### Requirement 6: Integration with Error Handling (ADR-005)

**User Story:** As a developer, I want the toast system to integrate with the existing error handling infrastructure so that error messages are displayed consistently across the application.

#### Acceptance Criteria

1. THE Toast System SHALL provide a utility function `showErrorToast(error: unknown)` that accepts any error type.
2. WHEN an error is passed to `showErrorToast()`, THE Toast System SHALL extract a user-friendly message using the `getErrorMessage()` utility from `src/utils/typeGuards.ts`.
3. WHERE the error is a BlockchainError, NetworkError, or ValidationError (from `src/utils/errors.ts`), THE Toast System SHALL extract the message and display it with the 'error' variant.
4. WHEN an error has a custom error code (e.g., 'USER_REJECTED', 'INSUFFICIENT_FUNDS'), THE Toast System SHALL log the error code for debugging purposes.
5. THE Toast System SHALL NOT expose sensitive error details (stack traces, API keys) in the toast message; sensitive data SHALL be logged only to the console (development) or Sentry (production).

---

### Requirement 7: TypeScript Support and Type Safety

**User Story:** As a developer using TypeScript, I want full type safety for toast options and methods so that I catch errors at development time.

#### Acceptance Criteria

1. THE Toast System SHALL export a `Toast` TypeScript interface with properties: type, message, duration, position, action.
2. THE Toast System SHALL export a `ToastOptions` TypeScript type that includes all optional configuration properties.
3. THE Toast System SHALL export function signatures for `success()`, `error()`, `warning()`, `info()` that accept message strings and optional ToastOptions.
4. WHEN a developer passes an invalid variant to the `toast()` method, THE TypeScript compiler SHALL raise a type error.
5. WHEN a developer uses `useToast()` outside a ToastProvider, THE IDE SHALL display a helpful error message at development time (via documentation or JSDoc).

---

### Requirement 8: Accessibility (WCAG 2.1 AA)

**User Story:** As an assistive technology user, I want toast notifications to be announced by screen readers and keyboard accessible so that I receive the same feedback as sighted users.

#### Acceptance Criteria

1. WHEN a toast is displayed, THE Toast System SHALL announce the message to screen readers using an `aria-live` region.
2. THE Toast System SHALL set `aria-live="polite"` for success and info toasts, allowing current speech to finish before announcement.
3. THE Toast System SHALL set `aria-live="assertive"` for error and warning toasts, interrupting current speech for urgent notifications.
4. WHEN a toast includes an action button, THE button SHALL have a descriptive aria-label and be keyboard focusable.
5. WHEN a user presses the Escape key, THE Toast System SHALL dismiss the currently focused toast (if it has focus).
6. THE Toast System SHALL maintain focus management so that focus does not return to a dismissed toast.
7. WHILE toasts are displayed, THE Toast System SHALL not interfere with keyboard navigation to other page elements.

---

### Requirement 9: Mobile and Responsive Behavior

**User Story:** As a mobile user, I want toast notifications to adapt to small screens and touch interactions so that notifications are readable and easy to dismiss.

#### Acceptance Criteria

1. ON mobile devices (< 768px width), THE Toast System SHALL display toasts at 100% width with padding, ensuring no text overflow.
2. WHEN a toast is displayed on a mobile device, THE close button SHALL have a minimum touch target size of 44x44 pixels (WCAG 2.1 requirement).
3. THE Toast System SHALL support swiping to dismiss on touch devices (swipe up or swipe left to dismiss).
4. WHERE the viewport height is small (< 600px), THE Toast System SHALL stack toasts from the bottom with reduced vertical spacing.
5. ON mobile devices, THE Toast System SHALL use the 'bottom' position by default instead of 'top'.

---

### Requirement 10: Toast Position and Viewport Management

**User Story:** As a developer, I want control over where toasts are displayed so that they don't overlap with fixed headers or other UI elements.

#### Acceptance Criteria

1. THE Toast System SHALL support toast positions: 'top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'.
2. WHERE a developer specifies a position in toast options, THE Toast System SHALL render the toast at the requested position.
3. IF no position is specified, THE Toast System SHALL use 'top-right' as the default on desktop and 'bottom-center' on mobile.
4. WHEN toasts are displayed, THE Toast System SHALL ensure they do not overlap with the application header, footer, or fixed navigation.
5. WHEN multiple toasts are displayed at the same position, THE Toast System SHALL stack them vertically with consistent spacing (8-12px gap).

---

### Requirement 11: Performance and Memory Management

**User Story:** As a developer, I want the toast system to manage memory efficiently so that long-running applications don't experience performance degradation.

#### Acceptance Criteria

1. THE Toast System SHALL maintain a maximum queue of 10 active toasts; IF more than 10 toasts are triggered, older toasts SHALL be dismissed to make room.
2. WHEN a toast is dismissed (auto or manual), THE Toast System SHALL remove it from the DOM and release associated memory.
3. THE Toast System SHALL NOT create memory leaks through event listener accumulation (all listeners SHALL be cleaned up when toasts are dismissed).
4. WHEN a component unmounts, THE Toast System SHALL not attempt to render toasts for that component (no "Can't perform a React state update on an unmounted component" warnings).
5. THE Toast System provider SHALL use `React.memo()` to prevent unnecessary re-renders of consuming components.

---

### Requirement 12: Testing Support and Mockability

**User Story:** As a developer writing tests, I want to mock or spy on the toast system so that I can verify notifications are triggered correctly without rendering actual toasts.

#### Acceptance Criteria

1. THE Toast System SHALL export a mock provider for testing (e.g., `<MockToastProvider>`) that captures toasts in a testable array.
2. WHEN using the mock provider, `useToast()` SHALL return methods that add toasts to an accessible test array instead of rendering them.
3. THE Toast System SHALL be compatible with Jest, Vitest, and React Testing Library for unit and integration tests.
4. WHEN a test calls `useToast().success('message')`, THE mock provider SHALL record the toast and allow assertions like `expect(toasts).toContainEqual({ type: 'success', message: 'message' })`.
5. WHEN a test finishes, THE mock provider SHALL clear the toast queue to prevent test pollution.

---

### Requirement 13: Documentation and Developer Experience

**User Story:** As a developer new to the project, I want clear documentation and examples so that I can implement toast notifications quickly and correctly.

#### Acceptance Criteria

1. THE Toast System SHALL include a `README.md` documenting how to use the hook, available options, and common patterns.
2. THE Toast System README SHALL include code examples for: success toast, error toast with action, warning toast with custom duration.
3. THE Toast System README SHALL document the integration with error handling (how to use `showErrorToast()` with errors from `src/utils/errors.ts`).
4. THE Toast System SHALL include JSDoc comments on all exported functions and interfaces.
5. THE Toast System SHALL document when NOT to use the toast system (e.g., for critical alerts requiring user acknowledgment).

---

### Requirement 14: Configuration and Customization

**User Story:** As a developer, I want to configure default toast behavior globally so that I don't repeat configuration in every toast call.

#### Acceptance Criteria

1. THE ToastProvider SHALL accept optional props to configure defaults: defaultDuration, defaultPosition, maxToasts.
2. WHEN the ToastProvider is initialized with custom props, THE Toast System SHALL use the custom defaults for all toasts created during the provider's lifetime.
3. WHERE a developer provides custom options to a specific toast call, THOSE options SHALL override the provider defaults for that toast only.
4. THE Toast System SHALL document how to configure defaults in the README.

---

### Requirement 15: Production Readiness and Error Recovery

**User Story:** As a production user, I want the toast system to remain stable even if the rendering library encounters issues.

#### Acceptance Criteria

1. IF the Sonner library fails to render a toast, THE Toast System SHALL log an error to Sentry (production) or console (development) but NOT crash the application.
2. WHEN an error occurs in a toast action callback, THE Toast System SHALL catch the error and display an error toast without crashing.
3. THE Toast System SHALL be compatible with Next.js server-side rendering (SSR) without causing hydration mismatches.
4. WHEN the application navigates to a new page, THE Toast System SHALL persist toasts across page boundaries (unless dismissed).
5. WHERE a developer uses the toast system in a Server Component, THE TypeScript compiler or documentation SHALL warn about incorrect usage.

---

## Acceptance Criteria for Common Correctness Properties

### Round-Trip Property Testing

**Scenario:** Toast creation and serialization round-trip.

1. WHEN a toast object is created with all properties (type, message, duration, position, action), THE Toast System SHALL serialize and deserialize it without losing information.
   - Example: `const original = { type: 'success', message: 'Done!', duration: 3000 }; const deserialized = deserialize(serialize(original)); expect(deserialized).toEqual(original)`.

---

### Idempotence Property Testing

**Scenario:** Multiple toast calls with identical parameters.

1. WHEN `useToast().success('message')` is called twice consecutively, THE Toast System SHALL display two separate toast notifications (not deduplicate).
2. WHEN `useToast().error('Same error')` is called multiple times in rapid succession, THE Toast System SHALL respect the max queue limit and not crash.

---

### Metamorphic Property Testing

**Scenario:** Queue size relationships.

1. WHEN N toasts are added to a queue with maxToasts=10, THE number of active toasts SHALL never exceed 10.
2. WHEN a toast with duration 0 is added, THE number of manual dismissals required to clear the queue SHALL equal the number of non-persistent toasts plus 1.

---

## Non-Functional Requirements

### Performance Constraints

- Toast display latency: Toast SHALL appear within 100ms of being triggered.
- No layout shift: Toast positioning SHALL not cause cumulative layout shift > 0.1 (CLS metric).

### Accessibility Standards

- WCAG 2.1 AA compliance minimum.
- Support for screen readers (NVDA, JAWS, VoiceOver).
- Keyboard-only navigation support.

### Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile Safari on iOS 13+
- Chrome Android 90+

### Deployment Considerations

- Changes MUST pass CI tests before merging to main branch.
- No external dependencies beyond Sonner (already in package.json).
- Bundle size impact: Toast provider + hook < 15KB (gzipped).


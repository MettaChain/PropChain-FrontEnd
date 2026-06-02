# Implementation Plan: Global Toast Notification System

## Overview

This implementation plan breaks down the Global Toast Notification System into discrete, incremental coding tasks. The system will be built in TypeScript/React using Next.js 16+ App Router, with Sonner as the underlying notification library. Tasks proceed from foundational infrastructure (types and context) through component implementation, integration with error handling, accessibility features, comprehensive testing, and documentation.

Each task builds on previous work and includes clear acceptance criteria. Optional sub-tasks are marked with `*` and can be skipped for faster MVP delivery.

---

## Tasks

- [x] 1. Set up project structure and core type definitions
  - Create directory structure under `src/contexts/toast/`
  - Create subdirectories: `components/`, `hooks/`, `types/`, `utils/`, `__mocks__/`, `__tests__/`
  - Define `Toast` and `ToastVariant` types
  - Define `ToastPosition` type with all supported positions
  - Define `ToastOptions` interface with optional configuration
  - Define `ToastContextType` interface with queue management methods
  - Define `UseToastReturn` interface for hook return type
  - Define `ToastProviderConfig` interface
  - Create `src/contexts/toast/types/index.ts` with all exports
  - Create `src/contexts/toast/constants.ts` with default values
  - _Requirements: 1.3, 7.1, 7.2, 7.3_

- [x] 2. Implement ToastContext and ToastProvider component
  - Create `src/contexts/toast/context.ts` defining the React Context
  - Implement `ToastProvider.tsx` component with 'use client' directive
  - Add queue state management with `useState`
  - Implement `addToast()` method with max queue enforcement (default 10)
  - Implement `removeToast()` method using array filter
  - Implement `clearToasts()` method
  - Wrap context value in `React.useMemo()` to prevent unnecessary re-renders
  - Accept optional props: `defaultDuration`, `defaultPosition`, `maxToasts`
  - Initialize Sonner Toaster component inside provider
  - Configure Toaster with theme and positioning defaults
  - Render children and Toaster
  - Handle hydration safety (no dynamic positioning on server)
  - _Requirements: 1.1, 1.2, 1.3, 1.6, 11.6, 14.1_

- [x] 3. Implement useToast hook with error handling
  - Create `src/contexts/toast/hooks/useToast.ts`
  - Extract ToastContext and throw clear error if outside provider
  - Generate unique toast IDs using `nanoid(6)`
  - Implement `success(message, options?)` method
  - Implement `error(message, options?)` method
  - Implement `warning(message, options?)` method
  - Implement `info(message, options?)` method
  - Implement generic `toast(toastObject)` method
  - Merge user options with provider defaults (user options take precedence)
  - Return all methods with TypeScript type safety
  - Add JSDoc comments for all methods
  - _Requirements: 2.1, 2.2, 2.3, 2.5, 7.4, 7.5_

- [x] 4. Verify context and hook integration
  - Ensure all tests pass for provider and hook setup
  - Verify no TypeScript errors in core infrastructure
  - Confirm hook throws error outside provider
  - Test hook works at various nesting depths
  - _Requirements: 1.1, 2.2, 2.3_

- [x] 5. Integrate Sonner library for toast rendering
  - Import Sonner's `Toaster` and `toast` functions
  - Update ToastProvider to render Sonner's Toaster with configured position
  - Create a wrapper function that triggers Sonner's toast() from context queue
  - Map Toast variants ('success', 'error', 'warning', 'info') to Sonner toast types
  - Set auto-dismiss duration (default 5000ms)
  - Configure Sonner to use custom styles (theme, colors, icons)
  - Test toast displays with correct variant styling
  - Test auto-dismiss timer works
  - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.5_

- [x] 6. Implement mobile and responsive behavior
  - Add responsive positioning logic (detect viewport width)
  - Set default position to 'bottom-center' on mobile (< 768px)
  - Set default position to 'top-right' on desktop
  - Implement text wrapping for mobile toasts (100% width with padding)
  - Ensure close button has 44x44px minimum touch target
  - Add support for swipe-to-dismiss gesture on touch devices
  - Test responsive behavior on mobile viewport
  - Test touch interactions work correctly
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 7. Implement accessibility features (WCAG 2.1 AA)
  - Add `aria-live` regions to toast container
  - Set `aria-live="polite"` for success and info toasts
  - Set `aria-live="assertive"` for error and warning toasts
  - Add `role="alert"` to error and warning toast containers
  - Add descriptive `aria-label` to action buttons
  - Make action buttons keyboard focusable
  - Implement Escape key listener to dismiss focused toast
  - Add focus management to prevent focus returning to dismissed toast
  - Ensure keyboard navigation doesn't get trapped in toasts
  - Test with screen reader (at minimum, use jest-axe for automated checks)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

- [x] 8. Implement toast auto-dismiss and pause on hover
  - Create timer management logic for auto-dismiss
  - Set default duration to 5000ms (5 seconds)
  - Allow zero duration for persistent toasts (no auto-dismiss)
  - Add pause-on-hover functionality
  - Pause timer when mouse enters toast
  - Resume timer when mouse leaves toast
  - Add visual countdown or fade effect on auto-dismiss
  - Test auto-dismiss timing (within reasonable variance)
  - Test pause/resume on hover interaction
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 9. Implement toast actions and interaction handling
  - Support `action` property in toast options (label, onClick, icon)
  - Render action button when action is provided
  - Execute action callback when button clicked
  - Auto-dismiss toast after action executed (500ms delay for UI feedback)
  - Support multiple toasts displayed simultaneously
  - Ensure toasts stack vertically without overlap
  - Test action button renders correctly
  - Test action callback executes
  - Test stacking behavior with multiple toasts
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 10. Integrate error handling with ADR-005
  - Create `src/contexts/toast/utils/errorToast.ts`
  - Implement `showErrorToast(error: unknown, options?: ToastOptions)` function
  - Use `getErrorMessage()` from `src/utils/typeGuards.ts` to extract user-friendly message
  - Use `getErrorCode()` to identify error type
  - Log error code and sensitive details separately (console in dev, Sentry in prod)
  - Don't expose stack traces, API keys, or system internals in toast message
  - Handle BlockchainError, NetworkError, ValidationError types
  - Return toast ID for programmatic reference
  - Add JSDoc comments documenting integration
  - Test error message extraction from different error types
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 11. Ensure maximum queue enforcement and memory management
  - Verify `addToast()` enforces max queue limit (default 10)
  - Remove oldest toast (FIFO) when queue reaches max and new toast added
  - Implement `removeToast()` with proper cleanup (event listeners, timers)
  - Verify no memory leaks from accumulated event listeners
  - Verify no state update warnings on unmounted components
  - Test queue never exceeds maximum size
  - Test oldest toasts removed when limit reached
  - Test memory usage remains stable over long-running sessions
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 12. Create mock provider for testing support
  - Create `src/contexts/toast/__mocks__/MockToastProvider.tsx`
  - Implement MockToastProvider with captured toast array (`__toasts`)
  - Expose `__reset()` method to clear test state
  - Make mock provider compatible with Jest, Vitest, React Testing Library
  - Ensure useToast() works with mock provider
  - Allow test assertions on captured toasts
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 13. Write property-based tests for core properties
  - Create `src/contexts/toast/__tests__/properties.test.ts`
  - **Property 1: Hook Returns Consistent Interface**
    - Property: For any component at any nesting depth, useToast() returns the same method signatures
    - Validates: Requirements 2.2
  
  - **Property 2: Configuration Options Override Defaults**
    - Property: Custom options provided to toast call override provider defaults for that toast only
    - Validates: Requirements 14.3
  
  - **Property 3: Auto-Dismiss Respects Custom Duration**
    - Property: Non-zero duration specified in options dismisses toast after ~that duration
    - Validates: Requirements 4.2
  
  - **Property 4: Queue Never Exceeds Maximum**
    - Property: Number of active toasts never exceeds configured maximum (default 10)
    - Validates: Requirements 11.1
  
  - **Property 5: Multiple Variants Display Without Interference**
    - Property: Any combination of toast variants renders with correct styling/icons without affecting other toasts
    - Validates: Requirements 3.2
  
  - **Property 6: Error Message Extraction Preserves Intent**
    - Property: Error message from showErrorToast() is non-empty and conveys error intent without sensitive details
    - Validates: Requirements 6.2, 6.5
  
  - **Property 7: Aria-Live Attributes Match Type**
    - Property: Aria-live attribute is "polite" for success/info and "assertive" for error/warning
    - Validates: Requirements 8.2, 8.3
  
  - **Property 8: Multiple Toasts Stack Vertically**
    - Property: Multiple toasts at same position render at different vertical positions without overlapping
    - Validates: Requirements 5.4
  
  - **Property 9: Persistent Toasts Don't Auto-Dismiss**
    - Property: Toast with duration 0 or null remains visible until manually dismissed
    - Validates: Requirements 4.3
  
  - **Property 10: Supported Positions Render Correctly**
    - Property: Any position from supported set renders toast at that position
    - Validates: Requirements 10.1, 10.2
  
  - Run property tests with minimum 100 iterations per property
  - Use generators for variants, durations, positions, error objects
  - Tag tests with property number and requirement references
  - _Requirements: 7.1, 7.2, Design Correctness Properties 1-10_

- [x] 14. Write unit tests for provider and hook
  - Create `src/contexts/toast/__tests__/ToastProvider.test.tsx`
  - Test provider mounts and initializes context
  - Test provider accepts custom defaultDuration, defaultPosition, maxToasts
  - Test addToast() adds toast to queue
  - Test removeToast() removes toast by ID
  - Test clearToasts() clears entire queue
  - Test max queue enforcement (10 limit)
  - Test old toasts removed when max reached
  - Create `src/contexts/toast/__tests__/useToast.test.tsx`
  - Test hook returns all methods (success, error, warning, info, toast)
  - Test hook throws outside provider
  - Test success() creates success toast with message
  - Test error() creates error toast with message
  - Test warning() creates warning toast with message
  - Test info() creates info toast with message
  - Test toast() creates toast with custom type
  - Test options override provider defaults
  - Test toast ID generation
  - _Requirements: 2.1, 2.2, 2.3, 2.5, 7.4_

- [x] 15. Write unit tests for error handling utility
  - Create `src/contexts/toast/__tests__/errorToast.test.ts`
  - Test showErrorToast() extracts message from error object
  - Test showErrorToast() handles BlockchainError
  - Test showErrorToast() handles NetworkError
  - Test showErrorToast() handles ValidationError
  - Test showErrorToast() logs error code for debugging
  - Test showErrorToast() doesn't expose stack traces
  - Test showErrorToast() doesn't expose API keys or sensitive data
  - Test showErrorToast() returns toast ID
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 16. Write integration tests with Next.js and Sonner
  - Create `src/contexts/toast/__tests__/integration.test.tsx`
  - Test provider wraps app without hydration mismatches
  - Test provider composes with other providers (QueryProvider, ThemeProvider)
  - Test toasts persist when navigating between routes
  - Test multiple toasts render simultaneously
  - Test auto-dismiss timing works correctly
  - Test pause-on-hover pauses timer
  - Test action button callback executes
  - Test close button removes toast immediately
  - Test keyboard navigation (Tab, Escape)
  - _Requirements: 1.4, 1.5, 15.3, 15.4_

- [x] 17. Write accessibility tests and keyboard handlers
  - Create `src/contexts/toast/__tests__/accessibility.test.tsx`
  - Test aria-live attributes are correct (polite/assertive)
  - Test aria-label on action buttons
  - Test role="alert" on error/warning toasts
  - Test Escape key dismisses focused toast
  - Test focus doesn't return to dismissed toast
  - Test touch target size (44x44px minimum)
  - Test color contrast meets WCAG AA (use jest-axe)
  - Test keyboard navigation works
  - Manually verify with screen reader (NVDA/JAWS/VoiceOver)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

- [x] 18. Checkpoint - Ensure all tests pass
  - Run full test suite: `npm run test -- src/contexts/toast`
  - Ensure all unit tests pass
  - Ensure all property tests pass
  - Ensure all integration tests pass
  - Ensure all accessibility tests pass
  - Verify TypeScript compilation: `npm run type-check`
  - Check code coverage is above 85%
  - Fix any failing tests before proceeding
  - _Requirements: All_

- [x] 19. Write JSDoc comments and inline documentation
  - Add JSDoc comments to ToastProvider component
  - Add JSDoc comments to useToast hook
  - Add JSDoc comments to all exported types and interfaces
  - Add JSDoc comments to errorToast utility
  - Include examples in JSDoc for common usage patterns
  - Document when NOT to use toast (critical alerts, server components)
  - Document provider props and their effects
  - _Requirements: 7.5, 13.4_

- [x] 20. Create comprehensive README documentation
  - Create `src/contexts/toast/README.md`
  - Document toast system overview and purpose
  - Document how to use useToast hook
  - Include code example: simple success toast
  - Include code example: error toast with action button
  - Include code example: warning toast with custom duration
  - Include code example: persistent toast (duration 0)
  - Document error handling integration (showErrorToast)
  - Document available options (duration, position, action, dismissible)
  - Document toast variants (success, error, warning, info)
  - Document supported positions
  - Document when NOT to use toast system
  - Document accessibility features
  - Document testing with MockToastProvider
  - Document configuration via provider props
  - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [x] 21. Export public API from main toast module
  - Create `src/contexts/toast/index.ts`
  - Export ToastProvider component
  - Export useToast hook
  - Export all TypeScript types and interfaces
  - Export showErrorToast utility
  - Export MockToastProvider for testing
  - Export constants (TOAST_VARIANTS, TOAST_POSITIONS, DEFAULT_DURATION)
  - Verify no internal implementation details exposed
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 22. Integrate ToastProvider into root layout
  - Update `app/layout.tsx` (or appropriate root layout file)
  - Import ToastProvider from `src/contexts/toast`
  - Wrap application content with ToastProvider
  - Ensure ToastProvider wraps below Suspense boundary if present
  - Verify no hydration mismatches in development
  - Test toasts work from any page in application
  - _Requirements: 1.1, 1.4, 1.5_

- [x] 23. Verify SSR compatibility and hydration safety
  - Ensure ToastProvider logic is safe for server-side rendering
  - Verify Sonner Toaster renders only on client side
  - Test development build has no hydration warnings
  - Test production build works correctly
  - Test toasts display immediately after hydration
  - _Requirements: 1.4, 15.3_

- [x] 24. Test error recovery and edge cases
  - Test action callback errors don't crash app
  - Test Sonner rendering failures degrade gracefully
  - Test provider initialization errors don't break app
  - Test rapid succession of toast additions
  - Test queue auto-removal of old toasts
  - Test cleanup when component unmounts
  - _Requirements: 15.1, 15.2, 15.4_

- [x] 25. Create example usage component
  - Create `src/components/examples/ToastExamples.tsx` (optional reference)
  - Demonstrate all toast types (success, error, warning, info)
  - Demonstrate toast with action button
  - Demonstrate persistent toast
  - Demonstrate showErrorToast() integration
  - Demonstrate custom duration
  - Demonstrate custom position
  - Note: Optional for documentation purposes only
  - _Requirements: 13.2_

- [x] 26. Run linting and code quality checks
  - Run ESLint: `npm run lint -- src/contexts/toast`
  - Run Prettier formatting: `npm run format -- src/contexts/toast`
  - Verify no console errors or warnings
  - Check for TypeScript strict mode compliance
  - Verify imports are correctly organized
  - _Requirements: All_

- [x] 27. Performance validation and bundle size check
  - Run bundle size check: `npm run size-limit -- src/contexts/toast`
  - Verify toast system < 15KB gzipped (including Sonner)
  - Verify context memoization prevents unnecessary re-renders
  - Profile render performance with React DevTools
  - Test auto-dismiss latency < 100ms
  - _Requirements: 11.5, Performance Constraints_

- [x] 28. Final checkpoint - Full system verification
  - All tests pass (unit, integration, property, accessibility)
  - No TypeScript errors
  - No linting errors
  - Code coverage > 85%
  - Documentation complete and accurate
  - ToastProvider integrated in root layout
  - No hydration mismatches
  - Toast display latency < 100ms
  - Bundle size acceptable
  - Ask user if they have questions or need clarifications before marking complete
  - _Requirements: All_

---

## Implementation Notes

### Task Dependencies

- Tasks 1-3 are foundational; subsequent tasks depend on completion
- Task 4 is a verification checkpoint before Sonner integration (Task 5)
- Tasks 6-12 can be developed in parallel once Tasks 1-5 are complete
- Tasks 13-17 (testing) depend on Tasks 1-12
- Task 18 verifies all tests pass before proceeding
- Tasks 19-28 are finalization tasks following test verification

### Code Organization

All code is organized under `src/contexts/toast/` with clear subdirectories:
- `components/`: UI components (ToastProvider)
- `hooks/`: Custom hooks (useToast)
- `types/`: TypeScript type definitions
- `utils/`: Utility functions (errorToast, validators)
- `__mocks__/`: Mock implementations for testing
- `__tests__/`: Test files

### Testing Strategy

- **Property-Based Tests** (Task 13): Verify universal properties hold across input ranges
- **Unit Tests** (Tasks 14-15): Test individual functions and components
- **Integration Tests** (Task 16): Test interaction with Next.js, Sonner, and other systems
- **Accessibility Tests** (Task 17): Ensure WCAG 2.1 AA compliance
- **Checkpoint** (Task 18): Verify all tests pass before finalization

### TypeScript and Type Safety

All code uses TypeScript strict mode with:
- No `any` types
- Full type coverage for all exported functions and components
- Discriminated unions for toast variants
- Type predicates for error type checking
- JSDoc comments for IDE autocompletion

### Error Handling

- Clear error message if `useToast()` used outside provider
- Graceful degradation if Sonner rendering fails
- Error boundary integration for action callback errors
- Sensitive error details logged separately (not in toast)

### Performance Considerations

- Context value memoized to prevent unnecessary re-renders
- Queue limited to 10 toasts (configurable)
- Efficient DOM cleanup on toast removal
- CSS transforms for smooth animations (GPU-accelerated)
- Bundle size target: < 15KB gzipped

---

## Acceptance Criteria Summary

✅ Toast provider manages global state without prop drilling  
✅ useToast hook provides type-safe notification methods  
✅ Four toast variants render with correct styling  
✅ Auto-dismiss works with configurable duration  
✅ Action buttons allow user interaction without navigation  
✅ Integration with error handling (ADR-005) complete  
✅ Full TypeScript type safety enforced  
✅ WCAG 2.1 AA accessibility compliance verified  
✅ Mobile and responsive behavior implemented  
✅ Queue enforces maximum of 10 active toasts  
✅ Memory management prevents leaks  
✅ Mock provider enables testing without rendering  
✅ Property-based tests verify universal properties  
✅ Comprehensive unit and integration tests  
✅ Documentation and JSDoc comments complete  
✅ SSR compatibility verified without hydration issues  


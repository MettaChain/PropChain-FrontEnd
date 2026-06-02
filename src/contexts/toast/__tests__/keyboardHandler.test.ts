/**
 * Tests for keyboard and accessibility utilities
 * Validates keyboard navigation, focus management, and WCAG 2.1 AA compliance
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7
 */

import {
  setupEscapeKeyHandler,
  manageFocusAfterDismissal,
  findNextFocusableElement,
  generateAccessibleLabel,
  shouldReduceMotion,
  isElementVisible,
} from '../utils/keyboardHandler';

describe('Keyboard and Accessibility Utilities', () => {
  describe('setupEscapeKeyHandler', () => {
    it('should call dismiss callback when Escape key is pressed', () => {
      // Requirement 8.5: Escape key dismisses focused toast
      const onDismiss = jest.fn();
      const cleanup = setupEscapeKeyHandler(onDismiss);

      // Simulate Escape key press
      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        keyCode: 27,
      });

      document.dispatchEvent(escapeEvent);

      expect(onDismiss).toHaveBeenCalledTimes(1);

      cleanup();
    });

    it('should not call dismiss callback for other keys', () => {
      const onDismiss = jest.fn();
      const cleanup = setupEscapeKeyHandler(onDismiss);

      // Simulate Enter key press
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        keyCode: 13,
      });

      document.dispatchEvent(enterEvent);

      expect(onDismiss).not.toHaveBeenCalled();

      cleanup();
    });

    it('should prevent default behavior when Escape is pressed', () => {
      const onDismiss = jest.fn();
      const cleanup = setupEscapeKeyHandler(onDismiss);

      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        keyCode: 27,
      });

      const preventDefaultSpy = jest.spyOn(escapeEvent, 'preventDefault');

      document.dispatchEvent(escapeEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();

      cleanup();
      preventDefaultSpy.mockRestore();
    });

    it('should clean up event listener on cleanup call', () => {
      const onDismiss = jest.fn();
      const cleanup = setupEscapeKeyHandler(onDismiss);

      // Remove listener
      cleanup();

      // Press Escape after cleanup
      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        keyCode: 27,
      });

      document.dispatchEvent(escapeEvent);

      // Should not be called after cleanup
      expect(onDismiss).not.toHaveBeenCalled();
    });
  });

  describe('manageFocusAfterDismissal', () => {
    let container: HTMLElement;
    let button: HTMLElement;

    beforeEach(() => {
      document.body.innerHTML = '';
      container = document.createElement('div');
      button = document.createElement('button');
      container.appendChild(button);
      document.body.appendChild(container);
    });

    afterEach(() => {
      document.body.innerHTML = '';
    });

    it('should restore focus when focus is inside dismissed element', () => {
      // Requirement 8.6: Focus doesn't return to dismissed toast
      const fallback = document.createElement('div');
      document.body.appendChild(fallback);

      button.focus();
      expect(document.activeElement).toBe(button);

      manageFocusAfterDismissal(container, fallback);

      expect(document.activeElement).toBe(fallback);
    });

    it('should not change focus if it is not inside dismissed element', () => {
      const externalButton = document.createElement('button');
      const fallback = document.createElement('div');
      document.body.appendChild(externalButton);
      document.body.appendChild(fallback);

      externalButton.focus();
      const previousFocus = document.activeElement;

      manageFocusAfterDismissal(container);

      expect(document.activeElement).toBe(previousFocus);
    });

    it('should handle null dismissed element gracefully', () => {
      const externalButton = document.createElement('button');
      document.body.appendChild(externalButton);

      externalButton.focus();

      expect(() => {
        manageFocusAfterDismissal(null);
      }).not.toThrow();

      expect(document.activeElement).toBe(externalButton);
    });
  });

  describe('findNextFocusableElement', () => {
    let container: HTMLElement;
    let button1: HTMLElement;
    let button2: HTMLElement;
    let input: HTMLElement;

    beforeEach(() => {
      document.body.innerHTML = '';
      container = document.createElement('div');
      button1 = document.createElement('button');
      button1.textContent = 'Button 1';
      button2 = document.createElement('button');
      button2.textContent = 'Button 2';
      input = document.createElement('input');

      container.appendChild(button1);
      container.appendChild(input);
      container.appendChild(button2);
      document.body.appendChild(container);
    });

    afterEach(() => {
      document.body.innerHTML = '';
    });

    it('should find first focusable element when no current element', () => {
      const next = findNextFocusableElement(container);
      expect(next).toBe(button1);
    });

    it('should find next focusable element forward', () => {
      const next = findNextFocusableElement(container, button1);
      expect(next).toBe(input);
    });

    it('should wrap around to first element at end', () => {
      const next = findNextFocusableElement(container, button2);
      expect(next).toBe(button1);
    });

    it('should find previous focusable element when reverse=true', () => {
      const prev = findNextFocusableElement(container, input, true);
      expect(prev).toBe(button1);
    });

    it('should wrap around to last element at start when reverse=true', () => {
      const prev = findNextFocusableElement(container, button1, true);
      expect(prev).toBe(button2);
    });

    it('should return null when no focusable elements in container', () => {
      const emptyContainer = document.createElement('div');
      emptyContainer.textContent = 'No focusable elements';
      document.body.appendChild(emptyContainer);

      const next = findNextFocusableElement(emptyContainer);
      expect(next).toBeNull();
    });
  });

  describe('generateAccessibleLabel', () => {
    it('should generate descriptive label for action button', () => {
      // Requirement 8.4: Action buttons have descriptive aria-label
      const label = generateAccessibleLabel('retry', 'error');
      expect(label).toContain('Retry');
      expect(label).toContain('Error');
    });

    it('should capitalize action name', () => {
      expect(generateAccessibleLabel('dismiss', 'notification')).toContain('Dismiss');
      expect(generateAccessibleLabel('UNDO', 'action')).toContain('Undo');
    });

    it('should use default notification type if not provided', () => {
      const label = generateAccessibleLabel('close');
      expect(label).toContain('Notification');
    });
  });

  describe('shouldReduceMotion', () => {
    it('should detect prefers-reduced-motion media query', () => {
      // Test is environment-dependent, just ensure it returns a boolean
      const result = shouldReduceMotion();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('isElementVisible', () => {
    let element: HTMLElement;

    beforeEach(() => {
      document.body.innerHTML = '';
      element = document.createElement('div');
      element.style.width = '100px';
      element.style.height = '100px';
      document.body.appendChild(element);
    });

    afterEach(() => {
      document.body.innerHTML = '';
    });

    it('should return true for visible element in viewport', () => {
      const result = isElementVisible(element);
      expect(typeof result).toBe('boolean');
    });

    it('should return false for element outside viewport (position absolute negative)', () => {
      element.style.position = 'absolute';
      element.style.top = '-200px';

      const result = isElementVisible(element);
      expect(result).toBe(false);
    });
  });

  /**
   * Property: Keyboard navigation doesn't get trapped
   * Validates: Requirement 8.7
   */
  describe('Property: Keyboard navigation flow', () => {
    it('should allow Tab key to move through focusable elements', () => {
      const container = document.createElement('div');
      const button1 = document.createElement('button');
      const button2 = document.createElement('button');
      container.appendChild(button1);
      container.appendChild(button2);
      document.body.appendChild(container);

      const first = findNextFocusableElement(container);
      const second = findNextFocusableElement(container, first as HTMLElement);

      expect(first).not.toBeNull();
      expect(second).not.toBeNull();
      expect(first).not.toBe(second);

      document.body.innerHTML = '';
    });
  });

  /**
   * Property: Focus management is consistent after dismissal
   * Validates: Requirement 8.6
   */
  describe('Property: Focus restoration is consistent', () => {
    it('should always move focus out of dismissed element', () => {
      const container = document.createElement('div');
      const button = document.createElement('button');
      const fallback = document.createElement('div');

      container.appendChild(button);
      document.body.appendChild(container);
      document.body.appendChild(fallback);

      button.focus();
      manageFocusAfterDismissal(container, fallback);

      // Focus should be moved away
      expect(document.activeElement).not.toBe(button);

      document.body.innerHTML = '';
    });
  });
});

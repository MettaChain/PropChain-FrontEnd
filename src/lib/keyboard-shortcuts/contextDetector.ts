/**
 * Context Detector Utility
 * 
 * Determines whether keyboard shortcuts should be active based on the currently focused element.
 * Shortcuts are disabled when the user is typing in text input fields to prevent conflicts.
 */

/**
 * Input types that should disable keyboard shortcuts
 */
const TEXT_INPUT_TYPES = [
  'text',
  'email',
  'password',
  'search',
  'tel',
  'url',
  'number',
  'date',
  'datetime-local',
  'month',
  'time',
  'week',
];

/**
 * Checks if the currently focused element is a text input context
 * where keyboard shortcuts should be disabled
 * 
 * @param element - The element to check (typically document.activeElement)
 * @returns True if shortcuts should be disabled, false otherwise
 * 
 * @example
 * if (isTextInputContext(document.activeElement)) {
 *   // Don't trigger shortcuts
 *   return;
 * }
 */
export function isTextInputContext(element: Element | null): boolean {
  if (!element) {
    return false;
  }
  
  const tagName = element.tagName.toLowerCase();
  
  // Check input elements
  if (tagName === 'input') {
    const inputElement = element as HTMLInputElement;
    const type = inputElement.type.toLowerCase();
    
    // Disable shortcuts for text-like input types
    return TEXT_INPUT_TYPES.includes(type);
  }
  
  // Check textarea elements
  if (tagName === 'textarea') {
    return true;
  }
  
  // Check contenteditable elements
  const contentEditable = element.getAttribute('contenteditable');
  if (contentEditable === 'true' || contentEditable === '') {
    return true;
  }
  
  // Check select elements
  if (tagName === 'select') {
    return true;
  }
  
  // Check if element is inside a contenteditable parent
  if (isInsideContentEditable(element)) {
    return true;
  }
  
  return false;
}

/**
 * Checks if an element is inside a contenteditable parent
 * 
 * @param element - The element to check
 * @returns True if inside a contenteditable element
 */
function isInsideContentEditable(element: Element): boolean {
  let current: Element | null = element.parentElement;
  
  while (current) {
    const contentEditable = current.getAttribute('contenteditable');
    if (contentEditable === 'true' || contentEditable === '') {
      return true;
    }
    current = current.parentElement;
  }
  
  return false;
}

/**
 * Checks if the active element is a text input context
 * Convenience function that uses document.activeElement
 * 
 * @returns True if shortcuts should be disabled
 * 
 * @example
 * if (isActiveElementTextInput()) {
 *   // Don't trigger shortcuts
 *   return;
 * }
 */
export function isActiveElementTextInput(): boolean {
  return isTextInputContext(document.activeElement);
}

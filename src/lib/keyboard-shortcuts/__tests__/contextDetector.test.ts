/**
 * Unit tests for contextDetector
 * 
 * Tests detection of various input types, textarea, contenteditable,
 * select elements, and non-input elements.
 */

import { isTextInputContext, isActiveElementTextInput } from '../contextDetector';

describe('contextDetector', () => {
  describe('isTextInputContext', () => {
    describe('input elements', () => {
      it('should return true for text input', () => {
        const input = document.createElement('input');
        input.type = 'text';
        expect(isTextInputContext(input)).toBe(true);
      });

      it('should return true for email input', () => {
        const input = document.createElement('input');
        input.type = 'email';
        expect(isTextInputContext(input)).toBe(true);
      });

      it('should return true for password input', () => {
        const input = document.createElement('input');
        input.type = 'password';
        expect(isTextInputContext(input)).toBe(true);
      });

      it('should return true for search input', () => {
        const input = document.createElement('input');
        input.type = 'search';
        expect(isTextInputContext(input)).toBe(true);
      });

      it('should return true for tel input', () => {
        const input = document.createElement('input');
        input.type = 'tel';
        expect(isTextInputContext(input)).toBe(true);
      });

      it('should return true for url input', () => {
        const input = document.createElement('input');
        input.type = 'url';
        expect(isTextInputContext(input)).toBe(true);
      });

      it('should return true for number input', () => {
        const input = document.createElement('input');
        input.type = 'number';
        expect(isTextInputContext(input)).toBe(true);
      });

      it('should return true for date input', () => {
        const input = document.createElement('input');
        input.type = 'date';
        expect(isTextInputContext(input)).toBe(true);
      });

      it('should return true for datetime-local input', () => {
        const input = document.createElement('input');
        input.type = 'datetime-local';
        expect(isTextInputContext(input)).toBe(true);
      });

      it('should return true for month input', () => {
        const input = document.createElement('input');
        input.type = 'month';
        expect(isTextInputContext(input)).toBe(true);
      });

      it('should return true for time input', () => {
        const input = document.createElement('input');
        input.type = 'time';
        expect(isTextInputContext(input)).toBe(true);
      });

      it('should return true for week input', () => {
        const input = document.createElement('input');
        input.type = 'week';
        expect(isTextInputContext(input)).toBe(true);
      });

      it('should return false for checkbox input', () => {
        const input = document.createElement('input');
        input.type = 'checkbox';
        expect(isTextInputContext(input)).toBe(false);
      });

      it('should return false for radio input', () => {
        const input = document.createElement('input');
        input.type = 'radio';
        expect(isTextInputContext(input)).toBe(false);
      });

      it('should return false for button input', () => {
        const input = document.createElement('input');
        input.type = 'button';
        expect(isTextInputContext(input)).toBe(false);
      });

      it('should return false for submit input', () => {
        const input = document.createElement('input');
        input.type = 'submit';
        expect(isTextInputContext(input)).toBe(false);
      });

      it('should return false for file input', () => {
        const input = document.createElement('input');
        input.type = 'file';
        expect(isTextInputContext(input)).toBe(false);
      });

      it('should return false for hidden input', () => {
        const input = document.createElement('input');
        input.type = 'hidden';
        expect(isTextInputContext(input)).toBe(false);
      });

      it('should handle uppercase input types', () => {
        const input = document.createElement('input');
        input.type = 'TEXT';
        expect(isTextInputContext(input)).toBe(true);
      });

      it('should handle mixed case input types', () => {
        const input = document.createElement('input');
        input.type = 'Email';
        expect(isTextInputContext(input)).toBe(true);
      });
    });

    describe('textarea elements', () => {
      it('should return true for textarea', () => {
        const textarea = document.createElement('textarea');
        expect(isTextInputContext(textarea)).toBe(true);
      });

      it('should return true for textarea with content', () => {
        const textarea = document.createElement('textarea');
        textarea.value = 'Some text';
        expect(isTextInputContext(textarea)).toBe(true);
      });

      it('should return true for disabled textarea', () => {
        const textarea = document.createElement('textarea');
        textarea.disabled = true;
        expect(isTextInputContext(textarea)).toBe(true);
      });
    });

    describe('contenteditable elements', () => {
      it('should return true for contenteditable="true"', () => {
        const div = document.createElement('div');
        div.setAttribute('contenteditable', 'true');
        expect(isTextInputContext(div)).toBe(true);
      });

      it('should return true for contenteditable="" (empty string)', () => {
        const div = document.createElement('div');
        div.setAttribute('contenteditable', '');
        expect(isTextInputContext(div)).toBe(true);
      });

      it('should return false for contenteditable="false"', () => {
        const div = document.createElement('div');
        div.setAttribute('contenteditable', 'false');
        expect(isTextInputContext(div)).toBe(false);
      });

      it('should return false for element without contenteditable', () => {
        const div = document.createElement('div');
        expect(isTextInputContext(div)).toBe(false);
      });

      it('should return true for span with contenteditable', () => {
        const span = document.createElement('span');
        span.setAttribute('contenteditable', 'true');
        expect(isTextInputContext(span)).toBe(true);
      });

      it('should return true for p with contenteditable', () => {
        const p = document.createElement('p');
        p.setAttribute('contenteditable', 'true');
        expect(isTextInputContext(p)).toBe(true);
      });
    });

    describe('select elements', () => {
      it('should return true for select element', () => {
        const select = document.createElement('select');
        expect(isTextInputContext(select)).toBe(true);
      });

      it('should return true for select with options', () => {
        const select = document.createElement('select');
        const option1 = document.createElement('option');
        option1.value = '1';
        const option2 = document.createElement('option');
        option2.value = '2';
        select.appendChild(option1);
        select.appendChild(option2);
        expect(isTextInputContext(select)).toBe(true);
      });

      it('should return true for disabled select', () => {
        const select = document.createElement('select');
        select.disabled = true;
        expect(isTextInputContext(select)).toBe(true);
      });
    });

    describe('non-input elements', () => {
      it('should return false for div', () => {
        const div = document.createElement('div');
        expect(isTextInputContext(div)).toBe(false);
      });

      it('should return false for span', () => {
        const span = document.createElement('span');
        expect(isTextInputContext(span)).toBe(false);
      });

      it('should return false for button', () => {
        const button = document.createElement('button');
        expect(isTextInputContext(button)).toBe(false);
      });

      it('should return false for a (link)', () => {
        const a = document.createElement('a');
        expect(isTextInputContext(a)).toBe(false);
      });

      it('should return false for p', () => {
        const p = document.createElement('p');
        expect(isTextInputContext(p)).toBe(false);
      });

      it('should return false for h1', () => {
        const h1 = document.createElement('h1');
        expect(isTextInputContext(h1)).toBe(false);
      });

      it('should return false for img', () => {
        const img = document.createElement('img');
        expect(isTextInputContext(img)).toBe(false);
      });

      it('should return false for body', () => {
        expect(isTextInputContext(document.body)).toBe(false);
      });
    });

    describe('nested contenteditable', () => {
      it('should return true for element inside contenteditable parent', () => {
        const parent = document.createElement('div');
        parent.setAttribute('contenteditable', 'true');
        const child = document.createElement('span');
        parent.appendChild(child);
        document.body.appendChild(parent);

        expect(isTextInputContext(child)).toBe(true);

        document.body.removeChild(parent);
      });

      it('should return true for deeply nested element in contenteditable', () => {
        const grandparent = document.createElement('div');
        grandparent.setAttribute('contenteditable', 'true');
        const parent = document.createElement('div');
        const child = document.createElement('span');
        parent.appendChild(child);
        grandparent.appendChild(parent);
        document.body.appendChild(grandparent);

        expect(isTextInputContext(child)).toBe(true);

        document.body.removeChild(grandparent);
      });

      it('should return false for element not in contenteditable', () => {
        const parent = document.createElement('div');
        const child = document.createElement('span');
        parent.appendChild(child);
        document.body.appendChild(parent);

        expect(isTextInputContext(child)).toBe(false);

        document.body.removeChild(parent);
      });

      it('should return false for element in contenteditable="false" parent', () => {
        const parent = document.createElement('div');
        parent.setAttribute('contenteditable', 'false');
        const child = document.createElement('span');
        parent.appendChild(child);
        document.body.appendChild(parent);

        expect(isTextInputContext(child)).toBe(false);

        document.body.removeChild(parent);
      });
    });

    describe('edge cases', () => {
      it('should return false for null element', () => {
        expect(isTextInputContext(null)).toBe(false);
      });

      it('should return false for undefined element', () => {
        expect(isTextInputContext(null)).toBe(false);
      });

      it('should handle elements with no parent', () => {
        const div = document.createElement('div');
        expect(isTextInputContext(div)).toBe(false);
      });

      it('should handle input with no type attribute (defaults to text)', () => {
        const input = document.createElement('input');
        // No type set, defaults to 'text'
        expect(isTextInputContext(input)).toBe(true);
      });
    });
  });

  describe('isActiveElementTextInput', () => {
    beforeEach(() => {
      // Clear any focused elements
      if (document.activeElement && document.activeElement !== document.body) {
        (document.activeElement as HTMLElement).blur();
      }
    });

    it('should return false when no element is focused', () => {
      expect(isActiveElementTextInput()).toBe(false);
    });

    it('should return true when text input is focused', () => {
      const input = document.createElement('input');
      input.type = 'text';
      document.body.appendChild(input);
      input.focus();

      expect(isActiveElementTextInput()).toBe(true);

      input.blur();
      document.body.removeChild(input);
    });

    it('should return true when textarea is focused', () => {
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      textarea.focus();

      expect(isActiveElementTextInput()).toBe(true);

      textarea.blur();
      document.body.removeChild(textarea);
    });

    it('should return false when button is focused', () => {
      const button = document.createElement('button');
      document.body.appendChild(button);
      button.focus();

      expect(isActiveElementTextInput()).toBe(false);

      button.blur();
      document.body.removeChild(button);
    });

    it('should return false when div is focused', () => {
      const div = document.createElement('div');
      div.tabIndex = 0; // Make it focusable
      document.body.appendChild(div);
      div.focus();

      expect(isActiveElementTextInput()).toBe(false);

      div.blur();
      document.body.removeChild(div);
    });

    it('should return true when contenteditable div is focused', () => {
      const div = document.createElement('div');
      div.setAttribute('contenteditable', 'true');
      div.tabIndex = 0;
      document.body.appendChild(div);
      div.focus();

      expect(isActiveElementTextInput()).toBe(true);

      div.blur();
      document.body.removeChild(div);
    });
  });
});

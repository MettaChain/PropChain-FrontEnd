/**
 * Accessibility tests for ResponsiveContainer and ResponsiveContainerFluid
 *
 * Issue #341 — WCAG 2.1 review covering:
 * - Semantic HTML / landmark elements via the `as` prop
 * - ARIA attributes: aria-label, aria-labelledby, aria-describedby, role
 * - Screen reader label propagation
 * - Keyboard navigation passthrough (tabIndex, onKeyDown)
 * - data-testid defaults
 * - No console.log calls in production code
 * - Responsive padding per viewport category
 * - Fluid variant behaviour
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import {
  ResponsiveContainer,
  ResponsiveContainerFluid,
  type ResponsiveContainerProps,
} from '../ResponsiveContainer';

// ---------------------------------------------------------------------------
// Mock ViewportProvider so we control the viewport category in tests
// ---------------------------------------------------------------------------
const mockUseViewport = jest.fn();

jest.mock('@/providers/ViewportProvider', () => ({
  useViewport: () => mockUseViewport(),
}));

// ---------------------------------------------------------------------------
// Helper — render with a controlled viewport category
// ---------------------------------------------------------------------------
function renderWithViewport(
  ui: React.ReactElement,
  category: 'mobile' | 'tablet' | 'desktop' = 'mobile'
) {
  mockUseViewport.mockReturnValue({ category });
  return render(ui);
}

// ---------------------------------------------------------------------------
// ResponsiveContainer — default rendering
// ---------------------------------------------------------------------------

describe('ResponsiveContainer — default rendering', () => {
  beforeEach(() => {
    mockUseViewport.mockReturnValue({ category: 'mobile' });
  });

  it('renders children', () => {
    render(<ResponsiveContainer>Hello world</ResponsiveContainer>);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('renders as a <div> by default', () => {
    const { container } = render(
      <ResponsiveContainer>Content</ResponsiveContainer>
    );
    expect(container.firstChild?.nodeName).toBe('DIV');
  });

  it('has data-testid="responsive-container" by default', () => {
    render(<ResponsiveContainer>Content</ResponsiveContainer>);
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
  });

  it('accepts a custom data-testid', () => {
    render(
      <ResponsiveContainer data-testid="my-container">Content</ResponsiveContainer>
    );
    expect(screen.getByTestId('my-container')).toBeInTheDocument();
  });

  it('merges additional className with base class', () => {
    render(
      <ResponsiveContainer className="bg-gray-100">Content</ResponsiveContainer>
    );
    const el = screen.getByTestId('responsive-container');
    expect(el).toHaveClass('responsive-container');
    expect(el).toHaveClass('bg-gray-100');
  });
});

// ---------------------------------------------------------------------------
// ResponsiveContainer — responsive padding
// ---------------------------------------------------------------------------

describe('ResponsiveContainer — responsive padding', () => {
  it('applies 16px padding on mobile', () => {
    renderWithViewport(
      <ResponsiveContainer>Content</ResponsiveContainer>,
      'mobile'
    );
    expect(screen.getByTestId('responsive-container')).toHaveStyle({
      padding: '16px',
    });
  });

  it('applies 24px padding on tablet', () => {
    renderWithViewport(
      <ResponsiveContainer>Content</ResponsiveContainer>,
      'tablet'
    );
    expect(screen.getByTestId('responsive-container')).toHaveStyle({
      padding: '24px',
    });
  });

  it('applies 32px padding on desktop', () => {
    renderWithViewport(
      <ResponsiveContainer>Content</ResponsiveContainer>,
      'desktop'
    );
    expect(screen.getByTestId('responsive-container')).toHaveStyle({
      padding: '32px',
    });
  });

  it('falls back to 16px for unknown viewport category', () => {
    mockUseViewport.mockReturnValue({ category: 'unknown' });
    render(<ResponsiveContainer>Content</ResponsiveContainer>);
    expect(screen.getByTestId('responsive-container')).toHaveStyle({
      padding: '16px',
    });
  });

  it('sets maxWidth: 100% and boxSizing: border-box', () => {
    renderWithViewport(
      <ResponsiveContainer>Content</ResponsiveContainer>,
      'desktop'
    );
    const el = screen.getByTestId('responsive-container');
    expect(el).toHaveStyle({ maxWidth: '100%', boxSizing: 'border-box' });
  });
});

// ---------------------------------------------------------------------------
// ResponsiveContainer — polymorphic `as` prop (WCAG: semantic landmarks)
// ---------------------------------------------------------------------------

describe('ResponsiveContainer — polymorphic `as` prop', () => {
  beforeEach(() => {
    mockUseViewport.mockReturnValue({ category: 'desktop' });
  });

  const semanticElements: Array<
    'div' | 'main' | 'section' | 'article' | 'aside' | 'header' | 'footer' | 'nav'
  > = ['div', 'main', 'section', 'article', 'aside', 'header', 'footer', 'nav'];

  semanticElements.forEach((tag) => {
    it(`renders as <${tag}> when as="${tag}"`, () => {
      const { container } = render(
        <ResponsiveContainer as={tag}>Content</ResponsiveContainer>
      );
      expect(container.firstChild?.nodeName).toBe(tag.toUpperCase());
    });
  });

  it('renders a <main> landmark accessible to screen readers', () => {
    render(
      <ResponsiveContainer as="main" aria-label="Main content">
        Content
      </ResponsiveContainer>
    );
    expect(screen.getByRole('main', { name: 'Main content' })).toBeInTheDocument();
  });

  it('renders a <nav> landmark with accessible name', () => {
    render(
      <ResponsiveContainer as="nav" aria-label="Primary navigation">
        <a href="/home">Home</a>
      </ResponsiveContainer>
    );
    expect(
      screen.getByRole('navigation', { name: 'Primary navigation' })
    ).toBeInTheDocument();
  });

  it('renders an <aside> landmark with accessible name', () => {
    render(
      <ResponsiveContainer as="aside" aria-label="Related content">
        Sidebar
      </ResponsiveContainer>
    );
    expect(
      screen.getByRole('complementary', { name: 'Related content' })
    ).toBeInTheDocument();
  });

  it('renders a <section> with aria-labelledby referencing a heading', () => {
    render(
      <ResponsiveContainer as="section" aria-labelledby="sec-title">
        <h2 id="sec-title">Section Title</h2>
        <p>Content</p>
      </ResponsiveContainer>
    );
    expect(
      screen.getByRole('region', { name: 'Section Title' })
    ).toBeInTheDocument();
  });

  it('renders an <article> element', () => {
    const { container } = render(
      <ResponsiveContainer as="article" aria-label="Property card">
        Property details
      </ResponsiveContainer>
    );
    expect(container.firstChild?.nodeName).toBe('ARTICLE');
    expect(screen.getByRole('article', { name: 'Property card' })).toBeInTheDocument();
  });

  it('renders a <header> element', () => {
    const { container } = render(
      <ResponsiveContainer as="header">Site header</ResponsiveContainer>
    );
    expect(container.firstChild?.nodeName).toBe('HEADER');
  });

  it('renders a <footer> element', () => {
    const { container } = render(
      <ResponsiveContainer as="footer">Site footer</ResponsiveContainer>
    );
    expect(container.firstChild?.nodeName).toBe('FOOTER');
  });
});

// ---------------------------------------------------------------------------
// ResponsiveContainer — ARIA attributes (WCAG 1.3.1, 4.1.2)
// ---------------------------------------------------------------------------

describe('ResponsiveContainer — ARIA attributes', () => {
  beforeEach(() => {
    mockUseViewport.mockReturnValue({ category: 'desktop' });
  });

  it('forwards aria-label to the rendered element', () => {
    render(
      <ResponsiveContainer aria-label="Property listing section">
        Content
      </ResponsiveContainer>
    );
    expect(
      screen.getByLabelText('Property listing section')
    ).toBeInTheDocument();
  });

  it('forwards aria-labelledby to the rendered element', () => {
    render(
      <>
        <h2 id="label-id">Container Label</h2>
        <ResponsiveContainer aria-labelledby="label-id">
          Content
        </ResponsiveContainer>
      </>
    );
    const el = screen.getByTestId('responsive-container');
    expect(el).toHaveAttribute('aria-labelledby', 'label-id');
  });

  it('forwards aria-describedby to the rendered element', () => {
    render(
      <>
        <p id="desc-id">Description text</p>
        <ResponsiveContainer aria-describedby="desc-id">
          Content
        </ResponsiveContainer>
      </>
    );
    const el = screen.getByTestId('responsive-container');
    expect(el).toHaveAttribute('aria-describedby', 'desc-id');
  });

  it('forwards an explicit role to the rendered element', () => {
    render(
      <ResponsiveContainer role="region" aria-label="Custom region">
        Content
      </ResponsiveContainer>
    );
    expect(
      screen.getByRole('region', { name: 'Custom region' })
    ).toBeInTheDocument();
  });

  it('does not set aria-label by default (no spurious ARIA on generic containers)', () => {
    render(<ResponsiveContainer>Content</ResponsiveContainer>);
    const el = screen.getByTestId('responsive-container');
    expect(el).not.toHaveAttribute('aria-label');
  });
});

// ---------------------------------------------------------------------------
// ResponsiveContainer — keyboard navigation passthrough (WCAG 2.1.1)
// ---------------------------------------------------------------------------

describe('ResponsiveContainer — keyboard navigation', () => {
  beforeEach(() => {
    mockUseViewport.mockReturnValue({ category: 'desktop' });
  });

  it('forwards tabIndex so the container can participate in tab order', () => {
    render(
      <ResponsiveContainer tabIndex={0}>Focusable container</ResponsiveContainer>
    );
    const el = screen.getByTestId('responsive-container');
    expect(el).toHaveAttribute('tabindex', '0');
  });

  it('tabIndex={-1} removes element from natural tab order', () => {
    render(
      <ResponsiveContainer tabIndex={-1}>Content</ResponsiveContainer>
    );
    expect(screen.getByTestId('responsive-container')).toHaveAttribute(
      'tabindex',
      '-1'
    );
  });

  it('forwards onKeyDown handler for keyboard interactions', () => {
    const onKeyDown = jest.fn();
    render(
      <ResponsiveContainer tabIndex={0} onKeyDown={onKeyDown}>
        Content
      </ResponsiveContainer>
    );
    fireEvent.keyDown(screen.getByTestId('responsive-container'), {
      key: 'Enter',
    });
    expect(onKeyDown).toHaveBeenCalledTimes(1);
  });

  it('forwards onClick handler', () => {
    const onClick = jest.fn();
    render(
      <ResponsiveContainer onClick={onClick}>Content</ResponsiveContainer>
    );
    fireEvent.click(screen.getByTestId('responsive-container'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// ResponsiveContainer — no console.log (issue #341 / production hygiene)
// ---------------------------------------------------------------------------

describe('ResponsiveContainer — no console.log in production code', () => {
  beforeEach(() => {
    mockUseViewport.mockReturnValue({ category: 'mobile' });
  });

  it('does not call console.log during render', () => {
    const spy = jest.spyOn(console, 'log');
    render(<ResponsiveContainer>Content</ResponsiveContainer>);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('does not call console.log on viewport category change', () => {
    const spy = jest.spyOn(console, 'log');
    const { rerender } = render(
      <ResponsiveContainer>Content</ResponsiveContainer>
    );
    mockUseViewport.mockReturnValue({ category: 'desktop' });
    rerender(<ResponsiveContainer>Content</ResponsiveContainer>);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// ResponsiveContainerFluid — rendering and accessibility
// ---------------------------------------------------------------------------

describe('ResponsiveContainerFluid — default rendering', () => {
  it('renders children', () => {
    render(<ResponsiveContainerFluid>Fluid content</ResponsiveContainerFluid>);
    expect(screen.getByText('Fluid content')).toBeInTheDocument();
  });

  it('renders as a <div> by default', () => {
    const { container } = render(
      <ResponsiveContainerFluid>Content</ResponsiveContainerFluid>
    );
    expect(container.firstChild?.nodeName).toBe('DIV');
  });

  it('has data-testid="responsive-container-fluid" by default', () => {
    render(<ResponsiveContainerFluid>Content</ResponsiveContainerFluid>);
    expect(screen.getByTestId('responsive-container-fluid')).toBeInTheDocument();
  });

  it('accepts a custom data-testid', () => {
    render(
      <ResponsiveContainerFluid data-testid="fluid-custom">
        Content
      </ResponsiveContainerFluid>
    );
    expect(screen.getByTestId('fluid-custom')).toBeInTheDocument();
  });

  it('applies clamp() fluid padding', () => {
    render(<ResponsiveContainerFluid>Content</ResponsiveContainerFluid>);
    expect(screen.getByTestId('responsive-container-fluid')).toHaveStyle({
      padding: 'clamp(16px, 4vw, 32px)',
    });
  });

  it('sets maxWidth: 100% and boxSizing: border-box', () => {
    render(<ResponsiveContainerFluid>Content</ResponsiveContainerFluid>);
    expect(screen.getByTestId('responsive-container-fluid')).toHaveStyle({
      maxWidth: '100%',
      boxSizing: 'border-box',
    });
  });
});

describe('ResponsiveContainerFluid — polymorphic `as` prop', () => {
  it('renders as <section> with aria-labelledby', () => {
    render(
      <ResponsiveContainerFluid as="section" aria-labelledby="fluid-title">
        <h2 id="fluid-title">Fluid Section</h2>
        <p>Content</p>
      </ResponsiveContainerFluid>
    );
    expect(
      screen.getByRole('region', { name: 'Fluid Section' })
    ).toBeInTheDocument();
  });

  it('renders as <main> with aria-label', () => {
    render(
      <ResponsiveContainerFluid as="main" aria-label="Main fluid content">
        Content
      </ResponsiveContainerFluid>
    );
    expect(
      screen.getByRole('main', { name: 'Main fluid content' })
    ).toBeInTheDocument();
  });

  it('renders as <nav> with aria-label', () => {
    render(
      <ResponsiveContainerFluid as="nav" aria-label="Fluid nav">
        <a href="/home">Home</a>
      </ResponsiveContainerFluid>
    );
    expect(
      screen.getByRole('navigation', { name: 'Fluid nav' })
    ).toBeInTheDocument();
  });
});

describe('ResponsiveContainerFluid — ARIA attributes', () => {
  it('forwards aria-label', () => {
    render(
      <ResponsiveContainerFluid aria-label="Fluid region">
        Content
      </ResponsiveContainerFluid>
    );
    expect(screen.getByLabelText('Fluid region')).toBeInTheDocument();
  });

  it('forwards aria-describedby', () => {
    render(
      <>
        <p id="fluid-desc">Description</p>
        <ResponsiveContainerFluid aria-describedby="fluid-desc">
          Content
        </ResponsiveContainerFluid>
      </>
    );
    expect(screen.getByTestId('responsive-container-fluid')).toHaveAttribute(
      'aria-describedby',
      'fluid-desc'
    );
  });

  it('forwards tabIndex for keyboard navigation', () => {
    render(
      <ResponsiveContainerFluid tabIndex={0}>Content</ResponsiveContainerFluid>
    );
    expect(screen.getByTestId('responsive-container-fluid')).toHaveAttribute(
      'tabindex',
      '0'
    );
  });

  it('does not call console.log during render', () => {
    const spy = jest.spyOn(console, 'log');
    render(<ResponsiveContainerFluid>Content</ResponsiveContainerFluid>);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('ResponsiveContainer — edge cases', () => {
  beforeEach(() => {
    mockUseViewport.mockReturnValue({ category: 'mobile' });
  });

  it('renders without optional props', () => {
    expect(() =>
      render(<ResponsiveContainer>Minimal</ResponsiveContainer>)
    ).not.toThrow();
  });

  it('renders deeply nested children', () => {
    render(
      <ResponsiveContainer>
        <div>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
        </div>
      </ResponsiveContainer>
    );
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('renders multiple sibling containers independently', () => {
    render(
      <>
        <ResponsiveContainer data-testid="container-a">A</ResponsiveContainer>
        <ResponsiveContainer data-testid="container-b">B</ResponsiveContainer>
      </>
    );
    expect(screen.getByTestId('container-a')).toBeInTheDocument();
    expect(screen.getByTestId('container-b')).toBeInTheDocument();
  });

  it('forwards unknown HTML attributes to the root element', () => {
    render(
      <ResponsiveContainer data-custom="value">Content</ResponsiveContainer>
    );
    expect(screen.getByTestId('responsive-container')).toHaveAttribute(
      'data-custom',
      'value'
    );
  });
});

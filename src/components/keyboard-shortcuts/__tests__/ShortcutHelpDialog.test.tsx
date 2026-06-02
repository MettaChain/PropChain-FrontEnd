import { render, screen } from '@testing-library/react';
import { ShortcutHelpDialog } from '../ShortcutHelpDialog';
import type { ShortcutEntry } from '@/types/keyboard-shortcuts';

describe('ShortcutHelpDialog', () => {
  const mockShortcuts = new Map([
    ['navigation', [
      {
        id: 'test-nav-1',
        config: {
          key: ['g', 'p'],
          description: 'Go to Properties',
          category: 'navigation',
          callback: jest.fn(),
          enabled: true,
          preventDefault: true,
          stopPropagation: false,
        },
        registeredAt: Date.now(),
      } as ShortcutEntry,
    ]],
    ['search', [
      {
        id: 'test-search-1',
        config: {
          key: '/',
          description: 'Focus search bar',
          category: 'search',
          callback: jest.fn(),
          enabled: true,
          preventDefault: true,
          stopPropagation: false,
        },
        registeredAt: Date.now(),
      } as ShortcutEntry,
    ]],
    ['ui', [
      {
        id: 'test-ui-1',
        config: {
          key: 'escape',
          description: 'Close modal/dialog',
          category: 'ui',
          callback: jest.fn(),
          enabled: true,
          preventDefault: true,
          stopPropagation: false,
        },
        registeredAt: Date.now(),
      } as ShortcutEntry,
    ]],
    ['general', [
      {
        id: 'test-general-1',
        config: {
          key: '?',
          description: 'Show keyboard shortcuts help',
          category: 'general',
          callback: jest.fn(),
          enabled: true,
          preventDefault: true,
          stopPropagation: false,
        },
        registeredAt: Date.now(),
      } as ShortcutEntry,
    ]],
  ]);

  it('should not render when open is false', () => {
    render(
      <ShortcutHelpDialog 
        open={false} 
        onOpenChange={jest.fn()} 
        shortcuts={mockShortcuts} 
      />
    );
    
    expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument();
  });

  it('should render when open is true', () => {
    render(
      <ShortcutHelpDialog 
        open={true} 
        onOpenChange={jest.fn()} 
        shortcuts={mockShortcuts}
      />
    );
    
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
  });

  it('should display shortcuts grouped by category', () => {
    render(
      <ShortcutHelpDialog 
        open={true} 
        onOpenChange={jest.fn()} 
        shortcuts={mockShortcuts}
      />
    );
    
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('UI')).toBeInTheDocument();
    expect(screen.getByText('General')).toBeInTheDocument();
  });

  it('should display shortcut descriptions', () => {
    render(
      <ShortcutHelpDialog 
        open={true} 
        onOpenChange={jest.fn()} 
        shortcuts={mockShortcuts}
      />
    );
    
    expect(screen.getByText('Go to Properties')).toBeInTheDocument();
    expect(screen.getByText('Focus search bar')).toBeInTheDocument();
    expect(screen.getByText('Close modal/dialog')).toBeInTheDocument();
    expect(screen.getByText('Show keyboard shortcuts help')).toBeInTheDocument();
  });

  it('should display shortcut keys as kbd elements', () => {
    render(
      <ShortcutHelpDialog 
        open={true} 
        onOpenChange={jest.fn()} 
        shortcuts={mockShortcuts}
      />
    );
    
    expect(screen.getByText('/')).toBeInTheDocument();
    expect(screen.getByText('?')).toBeInTheDocument();
    expect(screen.getByText('escape')).toBeInTheDocument();
  });
});
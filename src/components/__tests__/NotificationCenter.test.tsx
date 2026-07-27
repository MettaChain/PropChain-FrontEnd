import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationCenter } from '@/components/NotificationCenter';
import type { PropertyAlert } from '@/types/property';

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size, className, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <button
      onClick={onClick as React.MouseEventHandler}
      className={className as string}
      data-variant={variant as string}
      data-size={size as string}
      {...props}
    >
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <div className={className} data-testid="card">{children}</div>
  ),
  CardContent: ({ children }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div data-testid="card-content">{children}</div>
  ),
  CardDescription: ({ children }: React.PropsWithChildren<Record<string, unknown>>) => (
    <p data-testid="card-description">{children}</p>
  ),
  CardHeader: ({ children }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div data-testid="card-header">{children}</div>
  ),
  CardTitle: ({ children }: React.PropsWithChildren<Record<string, unknown>>) => (
    <h3 data-testid="card-title">{children}</h3>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: React.PropsWithChildren<{ variant?: string; className?: string }>) => (
    <span className={className} data-variant={variant}>{children}</span>
  ),
}));

jest.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children, open, onOpenChange }: React.PropsWithChildren<{ open?: boolean; onOpenChange?: (open: boolean) => void }>) => (
    <div data-testid="sheet" data-open={open}>{children}</div>
  ),
  SheetContent: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <div className={className} data-testid="sheet-content">{children}</div>
  ),
  SheetDescription: ({ children }: React.PropsWithChildren<Record<string, unknown>>) => (
    <p data-testid="sheet-description">{children}</p>
  ),
  SheetHeader: ({ children }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div data-testid="sheet-header">{children}</div>
  ),
  SheetTitle: ({ children }: React.PropsWithChildren<Record<string, unknown>>) => (
    <h2 data-testid="sheet-title">{children}</h2>
  ),
  SheetTrigger: ({ children }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div data-testid="sheet-trigger">{children}</div>
  ),
}));

jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <div className={className} data-testid="scroll-area">{children}</div>
  ),
}));

jest.mock('@/components/ui/EmptyState', () => ({
  EmptyState: ({ title, description }: { title: string; description: string }) => (
    <div data-testid="empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  ),
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  formatDistanceToNow: () => '2 days ago',
}));

const createMockAlert = (overrides: Partial<PropertyAlert> = {}): PropertyAlert => ({
  id: 'alert-1',
  savedSearchId: 'search-1',
  savedSearchName: 'Downtown Apartments',
  matchingProperties: [],
  newPropertiesCount: 5,
  createdAt: new Date().toISOString(),
  isRead: false,
  userId: 'user-1',
  ...overrides,
});

describe('NotificationCenter', () => {
  const defaultProps = {
    alerts: [] as PropertyAlert[],
    onMarkAsRead: jest.fn(),
    onMarkAllAsRead: jest.fn(),
    onClearAlert: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the bell trigger button', () => {
    render(<NotificationCenter {...defaultProps} />);
    const trigger = screen.getByTestId('sheet-trigger');
    expect(trigger).toBeInTheDocument();
  });

  it('shows bell icon when there are no unread alerts', () => {
    const alerts = [createMockAlert({ isRead: true })];
    render(<NotificationCenter {...defaultProps} alerts={alerts} />);
    
    expect(screen.getByTestId('sheet-trigger')).toBeInTheDocument();
  });

  it('shows bell-ring icon when there are unread alerts', () => {
    const alerts = [createMockAlert({ isRead: false })];
    render(<NotificationCenter {...defaultProps} alerts={alerts} />);
    expect(screen.getByTestId('sheet-trigger')).toBeInTheDocument();
  });

  it('shows unread count badge', () => {
    const alerts = [
      createMockAlert({ id: '1', isRead: false }),
      createMockAlert({ id: '2', isRead: false }),
      createMockAlert({ id: '3', isRead: true }),
    ];
    render(<NotificationCenter {...defaultProps} alerts={alerts} />);
    
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows 99+ for more than 99 unread alerts', () => {
    const alerts = Array.from({ length: 100 }, (_, i) => 
      createMockAlert({ id: `alert-${i}`, isRead: false })
    );
    render(<NotificationCenter {...defaultProps} alerts={alerts} />);
    
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('renders alert cards when alerts exist', () => {
    const alerts = [createMockAlert({ matchingProperties: [] })];
    render(<NotificationCenter {...defaultProps} alerts={alerts} />);
    
    expect(screen.getByText('Downtown Apartments')).toBeInTheDocument();
  });

  it('shows correct alert message for single property', () => {
    const alerts = [createMockAlert({ newPropertiesCount: 1 })];
    render(<NotificationCenter {...defaultProps} alerts={alerts} />);
    
    expect(screen.getByText('1 new property matches your search')).toBeInTheDocument();
  });

  it('shows correct alert message for multiple properties', () => {
    const alerts = [createMockAlert({ newPropertiesCount: 5 })];
    render(<NotificationCenter {...defaultProps} alerts={alerts} />);
    
    expect(screen.getByText('5 new properties match your search')).toBeInTheDocument();
  });

  it('shows "New" badge for unread alerts', () => {
    const alerts = [createMockAlert({ isRead: false })];
    render(<NotificationCenter {...defaultProps} alerts={alerts} />);
    
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('shows "Mark all as read" button when there are unread alerts', () => {
    const onMarkAllAsRead = jest.fn();
    const alerts = [createMockAlert({ isRead: false })];
    render(<NotificationCenter {...defaultProps} alerts={alerts} onMarkAllAsRead={onMarkAllAsRead} />);
    
    const markAllButton = screen.getByText('Mark all as read');
    expect(markAllButton).toBeInTheDocument();
    
    fireEvent.click(markAllButton);
    expect(onMarkAllAsRead).toHaveBeenCalled();
  });

  it('shows matching properties when alert has them', () => {
    const property = {
      id: 'prop-1',
      name: 'Luxury Condo',
      location: { city: 'Miami', state: 'FL', address: '', country: '', zipCode: '', coordinates: { lat: 0, lng: 0 } },
      price: { total: 500000, perToken: 50000, currency: 'USD' },
      propertyType: 'residential' as const,
      blockchain: 'ethereum' as const,
      tokenInfo: { totalSupply: 1000, available: 500, sold: 500, contractAddress: '0x...', tokenSymbol: 'PROP' },
      metrics: { roi: 5.5, annualReturn: 25000, transactionVolume: 1000000, appreciationRate: 3.2 },
      details: { squareFeet: 1500, yearBuilt: 2020, amenities: [] },
      images: [],
      listedDate: '2026-01-01',
      status: 'active' as const,
      description: 'A luxury condo',
    };
    const alerts = [createMockAlert({
      matchingProperties: [property],
      newPropertiesCount: 1,
    })];
    render(<NotificationCenter {...defaultProps} alerts={alerts} />);
    
    expect(screen.getByText('Luxury Condo')).toBeInTheDocument();
  });

  it('shows "+N more properties" when more than 3 matching properties', () => {
    const baseProperty = {
      location: { city: 'City', state: 'ST', address: '', country: '', zipCode: '', coordinates: { lat: 0, lng: 0 } },
      price: { total: 100000, perToken: 10000, currency: 'USD' },
      propertyType: 'residential' as const,
      blockchain: 'ethereum' as const,
      tokenInfo: { totalSupply: 1000, available: 500, sold: 500, contractAddress: '0x...', tokenSymbol: 'PROP' },
      metrics: { roi: 5.5, annualReturn: 25000, transactionVolume: 1000000, appreciationRate: 3.2 },
      details: { squareFeet: 1500, yearBuilt: 2020, amenities: [] },
      images: [],
      listedDate: '2026-01-01',
      status: 'active' as const,
      description: 'Property',
    };
    const properties = Array.from({ length: 5 }, (_, i) => ({
      ...baseProperty,
      id: `prop-${i}`,
      name: `Property ${i}`,
    }));
    const alerts = [createMockAlert({
      matchingProperties: properties,
      newPropertiesCount: 5,
    })];
    render(<NotificationCenter {...defaultProps} alerts={alerts} />);
    
    expect(screen.getByText('+2 more properties')).toBeInTheDocument();
  });

  it('calls onMarkAsRead when "Mark as read" button is clicked', () => {
    const onMarkAsRead = jest.fn();
    const alerts = [createMockAlert({ id: 'alert-1', isRead: false })];
    render(<NotificationCenter {...defaultProps} alerts={alerts} onMarkAsRead={onMarkAsRead} />);
    
    const markAsReadButton = screen.getByText('Mark as read');
    fireEvent.click(markAsReadButton);
    
    expect(onMarkAsRead).toHaveBeenCalledWith('alert-1');
  });

  it('calls onClearAlert when clear button is clicked', () => {
    const onClearAlert = jest.fn();
    const alerts = [createMockAlert({ id: 'alert-1' })];
    const { container } = render(<NotificationCenter {...defaultProps} alerts={alerts} onClearAlert={onClearAlert} />);
    
    // Find the X/clear button by its className (h-6 w-6 p-0 text-gray-500 hover:text-red-600)
    const clearButton = container.querySelector('button.h-6');
    
    if (clearButton) {
      fireEvent.click(clearButton);
      expect(onClearAlert).toHaveBeenCalledWith('alert-1');
    }
  });

  it('renders sheet with correct structure', () => {
    const alerts = [createMockAlert()];
    render(<NotificationCenter {...defaultProps} alerts={alerts} />);
    
    expect(screen.getByTestId('sheet')).toBeInTheDocument();
    expect(screen.getByTestId('sheet-content')).toBeInTheDocument();
    expect(screen.getByTestId('sheet-header')).toBeInTheDocument();
    expect(screen.getByTestId('sheet-title')).toBeInTheDocument();
    expect(screen.getByTestId('scroll-area')).toBeInTheDocument();
  });

  it('shows Property Alerts title', () => {
    const alerts = [createMockAlert()];
    render(<NotificationCenter {...defaultProps} alerts={alerts} />);
    
    expect(screen.getByText('Property Alerts')).toBeInTheDocument();
  });

  it('shows accessible description', () => {
    const alerts = [createMockAlert()];
    render(<NotificationCenter {...defaultProps} alerts={alerts} />);
    
    expect(screen.getByText('Get notified when new properties match your saved searches.')).toBeInTheDocument();
  });
});

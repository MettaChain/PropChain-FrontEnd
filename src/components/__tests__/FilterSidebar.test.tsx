import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterSidebar } from '../FilterSidebar';
import { DEFAULT_FILTERS } from '@/types/property';
import type { SearchFilters } from '@/types/property';

const activeFilters: SearchFilters = {
  ...DEFAULT_FILTERS,
  priceRange: [100000, 500000],
  propertyTypes: ['residential'],
  blockchains: ['ethereum'],
  roiMin: 5,
  bedrooms: [2],
};

describe('FilterSidebar visual snapshots', () => {
  it('matches snapshot with default filters', () => {
    const { container } = render(
      <FilterSidebar
        filters={DEFAULT_FILTERS}
        onFilterChange={jest.fn()}
        onClearFilters={jest.fn()}
      />,
    );
    expect(container).toMatchSnapshot();
  });

  it('matches snapshot with active filters', () => {
    const { container } = render(
      <FilterSidebar
        filters={activeFilters}
        onFilterChange={jest.fn()}
        onClearFilters={jest.fn()}
      />,
    );
    expect(container).toMatchSnapshot();
  });

  it('matches snapshot for sidebar panel only', () => {
    const { getByTestId } = render(
      <FilterSidebar
        filters={DEFAULT_FILTERS}
        onFilterChange={jest.fn()}
        onClearFilters={jest.fn()}
      />,
    );
    expect(getByTestId('filter-sidebar')).toMatchSnapshot();
  });
});

// ─── Clear all ────────────────────────────────────────────────────────────────

describe('FilterSidebar – clear filters', () => {
  it('does not show "Clear all" button when no filters are active', () => {
    render(
      <FilterSidebar
        filters={DEFAULT_FILTERS}
        onFilterChange={jest.fn()}
        onClearFilters={jest.fn()}
      />,
    );
    expect(screen.queryByRole('button', { name: /clear all/i })).not.toBeInTheDocument();
  });

  it('shows "Clear all" button when filters are active', () => {
    render(
      <FilterSidebar
        filters={activeFilters}
        onFilterChange={jest.fn()}
        onClearFilters={jest.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /clear all/i })).toBeInTheDocument();
  });

  it('calls onClearFilters when "Clear all" is clicked', async () => {
    const onClearFilters = jest.fn();
    render(
      <FilterSidebar
        filters={activeFilters}
        onFilterChange={jest.fn()}
        onClearFilters={onClearFilters}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /clear all/i }));
    expect(onClearFilters).toHaveBeenCalledTimes(1);
  });
});

// ─── Mobile drawer ────────────────────────────────────────────────────────────

describe('FilterSidebar – mobile drawer', () => {
  it('sidebar is off-screen by default (translate-x-full class)', () => {
    render(
      <FilterSidebar
        filters={DEFAULT_FILTERS}
        onFilterChange={jest.fn()}
        onClearFilters={jest.fn()}
      />,
    );
    const sidebar = screen.getByTestId('filter-sidebar');
    expect(sidebar.className).toMatch(/-translate-x-full/);
  });

  it('opens drawer when mobile Filters button is clicked', async () => {
    render(
      <FilterSidebar
        filters={DEFAULT_FILTERS}
        onFilterChange={jest.fn()}
        onClearFilters={jest.fn()}
      />,
    );
    const mobileBtn = screen.getByRole('button', { name: /filters/i });
    await userEvent.click(mobileBtn);
    const sidebar = screen.getByTestId('filter-sidebar');
    expect(sidebar.className).toMatch(/translate-x-0/);
  });

  it('closes drawer when overlay is clicked', async () => {
    const { container } = render(
      <FilterSidebar
        filters={DEFAULT_FILTERS}
        onFilterChange={jest.fn()}
        onClearFilters={jest.fn()}
      />,
    );
    // Open first
    await userEvent.click(screen.getByRole('button', { name: /filters/i }));
    // Click the overlay (fixed inset-0 div)
    const overlay = container.querySelector('.fixed.inset-0');
    expect(overlay).not.toBeNull();
    fireEvent.click(overlay!);
    const sidebar = screen.getByTestId('filter-sidebar');
    expect(sidebar.className).toMatch(/-translate-x-full/);
  });

  it('shows "Active" badge on mobile button when filters are active', () => {
    render(
      <FilterSidebar
        filters={activeFilters}
        onFilterChange={jest.fn()}
        onClearFilters={jest.fn()}
      />,
    );
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('does not show "Active" badge when no filters are active', () => {
    render(
      <FilterSidebar
        filters={DEFAULT_FILTERS}
        onFilterChange={jest.fn()}
        onClearFilters={jest.fn()}
      />,
    );
    expect(screen.queryByText('Active')).not.toBeInTheDocument();
  });
});

// ─── Accessibility tree ───────────────────────────────────────────────────────

describe('FilterSidebar – accessibility', () => {
  it('sidebar heading is present and labelled', () => {
    render(
      <FilterSidebar
        filters={DEFAULT_FILTERS}
        onFilterChange={jest.fn()}
        onClearFilters={jest.fn()}
      />,
    );
    expect(screen.getByRole('heading', { name: /filters/i })).toBeInTheDocument();
  });

  it('price range inputs have accessible labels', () => {
    render(
      <FilterSidebar
        filters={DEFAULT_FILTERS}
        onFilterChange={jest.fn()}
        onClearFilters={jest.fn()}
      />,
    );
    expect(screen.getByText(/min price/i)).toBeInTheDocument();
    expect(screen.getByText(/max price/i)).toBeInTheDocument();
  });

  it('property type checkboxes are keyboard-accessible', () => {
    render(
      <FilterSidebar
        filters={DEFAULT_FILTERS}
        onFilterChange={jest.fn()}
        onClearFilters={jest.fn()}
      />,
    );
    const checkboxes = screen.getAllByRole('checkbox');
    // At least one checkbox must exist (property types + blockchains)
    expect(checkboxes.length).toBeGreaterThan(0);
    checkboxes.forEach(cb => {
      expect(cb).not.toHaveAttribute('tabindex', '-1');
    });
  });

  it('bedroom buttons are accessible buttons', () => {
    render(
      <FilterSidebar
        filters={DEFAULT_FILTERS}
        onFilterChange={jest.fn()}
        onClearFilters={jest.fn()}
      />,
    );
    // The bedroom buttons render as role=button
    const bedroomSection = screen.getByText(/bedrooms/i).closest('div')!;
    const buttons = within(bedroomSection).getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});

// ─── Filter interactions & URL-sync callbacks ─────────────────────────────────

describe('FilterSidebar – filter interactions', () => {
  it('calls onFilterChange with propertyTypes when a type checkbox is toggled', async () => {
    const onFilterChange = jest.fn();
    render(
      <FilterSidebar
        filters={DEFAULT_FILTERS}
        onFilterChange={onFilterChange}
        onClearFilters={jest.fn()}
      />,
    );
    const residentialCheckbox = screen.getByRole('checkbox', { name: /residential/i });
    await userEvent.click(residentialCheckbox);
    expect(onFilterChange).toHaveBeenCalledWith('propertyTypes', ['residential']);
  });

  it('removes a property type when an already-checked checkbox is clicked', async () => {
    const onFilterChange = jest.fn();
    render(
      <FilterSidebar
        filters={activeFilters}
        onFilterChange={onFilterChange}
        onClearFilters={jest.fn()}
      />,
    );
    const residentialCheckbox = screen.getByRole('checkbox', { name: /residential/i });
    await userEvent.click(residentialCheckbox);
    expect(onFilterChange).toHaveBeenCalledWith('propertyTypes', []);
  });

  it('calls onFilterChange with blockchains when a network checkbox is toggled', async () => {
    const onFilterChange = jest.fn();
    render(
      <FilterSidebar
        filters={DEFAULT_FILTERS}
        onFilterChange={onFilterChange}
        onClearFilters={jest.fn()}
      />,
    );
    const ethereumCheckbox = screen.getByRole('checkbox', { name: /ethereum/i });
    await userEvent.click(ethereumCheckbox);
    expect(onFilterChange).toHaveBeenCalledWith('blockchains', ['ethereum']);
  });

  it('calls onFilterChange with bedrooms when a bedroom button is clicked', async () => {
    const onFilterChange = jest.fn();
    render(
      <FilterSidebar
        filters={DEFAULT_FILTERS}
        onFilterChange={onFilterChange}
        onClearFilters={jest.fn()}
      />,
    );
    const bedroomSection = screen.getByText(/bedrooms/i).closest('div')!;
    const btn2 = within(bedroomSection).getByRole('button', { name: /^2\+$/i });
    await userEvent.click(btn2);
    expect(onFilterChange).toHaveBeenCalledWith('bedrooms', [2]);
  });

  it('calls onFilterChange for min price input change', async () => {
    const onFilterChange = jest.fn();
    render(
      <FilterSidebar
        filters={DEFAULT_FILTERS}
        onFilterChange={onFilterChange}
        onClearFilters={jest.fn()}
      />,
    );
    const minPriceInput = screen.getByPlaceholderText('$0');
    fireEvent.change(minPriceInput, { target: { value: '100000' } });
    expect(onFilterChange).toHaveBeenCalledWith('priceRange', [100000, 10000000]);
  });

  it('calls onFilterChange for max price input change', async () => {
    const onFilterChange = jest.fn();
    render(
      <FilterSidebar
        filters={DEFAULT_FILTERS}
        onFilterChange={onFilterChange}
        onClearFilters={jest.fn()}
      />,
    );
    const maxPriceInput = screen.getByPlaceholderText('$10,000,000');
    fireEvent.change(maxPriceInput, { target: { value: '5000000' } });
    expect(onFilterChange).toHaveBeenCalledWith('priceRange', [0, 5000000]);
  });

  it('calls onFilterChange for roiMin change', async () => {
    const onFilterChange = jest.fn();
    render(
      <FilterSidebar
        filters={DEFAULT_FILTERS}
        onFilterChange={onFilterChange}
        onClearFilters={jest.fn()}
      />,
    );
    const minRoiInput = screen.getByPlaceholderText('0%');
    fireEvent.change(minRoiInput, { target: { value: '5' } });
    expect(onFilterChange).toHaveBeenCalledWith('roiMin', 5);
  });
});

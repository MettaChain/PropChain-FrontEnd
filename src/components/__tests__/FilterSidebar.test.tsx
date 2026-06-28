import { render } from '@testing-library/react';
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

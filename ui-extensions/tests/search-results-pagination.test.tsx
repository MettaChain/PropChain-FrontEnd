import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SearchResultsPagination } from '../components/SearchResultsPagination';

describe('SearchResultsPagination', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/search');
  });

  it('restores URL pagination, preserves other parameters, and resets to page 1 when page size changes', async () => {
    window.history.replaceState(null, '', '/search?page=3&size=25&sort=price');
    const onPageChange = jest.fn();
    const onPageSizeChange = jest.fn();

    render(
      <SearchResultsPagination
        totalResults={500}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />,
    );

    expect(await screen.findByRole('button', { name: 'Go to page 3' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('51–75')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('combobox', { name: 'Results per page' }), {
      target: { value: '50' },
    });

    await waitFor(() => {
      expect(window.location.search).toContain('page=1');
      expect(window.location.search).toContain('size=50');
    });
    expect(window.location.search).toContain('sort=price');
    expect(onPageChange).toHaveBeenCalledWith(1);
    expect(onPageSizeChange).toHaveBeenCalledWith(50);
  });

  it('supports jump-to-page and disables previous and next at their boundaries', async () => {
    render(<SearchResultsPagination totalResults={1000} />);

    expect(await screen.findByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeEnabled();

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Go to page' }), {
      target: { value: '100' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Go' }));

    expect(await screen.findByRole('button', { name: 'Go to page 100' })).toHaveAttribute('aria-current', 'page');
    expect(window.location.search).toContain('page=100');
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeEnabled();
    expect(screen.getByText('991–1000')).toBeInTheDocument();
  });
});

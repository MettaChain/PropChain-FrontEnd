import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Gallery } from '../Gallery';

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ priority: _priority, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) => <img {...props} />,
}));

const images = ['/one.jpg', '/two.jpg', '/three.jpg', '/four.jpg', '/five.jpg', '/six.jpg'] as const;

describe('Gallery', () => {
  it('explains the empty state without interactive image controls', () => {
    render(<Gallery images={[]} label="Exhibition" />);
    expect(screen.getByRole('status')).toHaveTextContent('No images available');
    expect(screen.getByRole('status')).toHaveTextContent('Images will appear here when they are added.');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('supports custom empty copy outside the property domain', () => {
    render(<Gallery images={[]} label="Exhibition" emptyTitle="No artwork yet" emptyDescription="Add your first artwork." />);
    expect(screen.getByRole('heading', { name: 'No artwork yet' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Add your first artwork.');
  });

  it('opens the main image with the keyboard and returns focus on close', async () => {
    const user = userEvent.setup();
    render(<Gallery images={images} label="Exhibition" />);
    await user.tab();
    const trigger = screen.getByRole('button', { name: 'View all 6 images of Exhibition' });
    expect(trigger).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('dialog', { name: 'Exhibition' })).toBeInTheDocument();
    expect(screen.getByText('1 / 6')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('opens the first hidden image using the more control', () => {
    render(<Gallery images={images} label="Exhibition" />);
    fireEvent.click(screen.getByRole('button', { name: 'View 1 more images of Exhibition' }));
    expect(screen.getByText('6 / 6')).toBeInTheDocument();
  });

  it('omits thumbnails and more controls for a single image', () => {
    render(<Gallery images={['/one.jpg']} label="Exhibition" />);
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('resets the viewer and loading state when the collection changes', () => {
    const { rerender, container } = render(<Gallery images={images} label="Exhibition" />);
    fireEvent.load(screen.getByAltText('Exhibition'));
    expect(container.querySelector('.animate-pulse')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'View 1 more images of Exhibition' }));
    rerender(<Gallery images={['/replacement.jpg']} label="Exhibition" />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    fireEvent.error(screen.getByAltText('Exhibition'));
    expect(container.querySelector('.animate-pulse')).toBeNull();
    rerender(<Gallery images={[]} label="Exhibition" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it.each(['light', 'dark'])('uses shared theme tokens in the %s theme', (theme) => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      const { rerender } = render(<Gallery images={[]} label="Exhibition" />);
      expect(screen.getByRole('region', { name: 'Exhibition' })).toHaveClass('bg-muted', 'text-foreground', 'border-border');
      rerender(<Gallery images={images} label="Exhibition" />);
      expect(screen.getByText('View all 6 images')).toHaveClass('bg-background/95', 'text-foreground');
      expect(screen.getByRole('button', { name: 'View 1 more images of Exhibition' })).toHaveClass('bg-muted', 'text-foreground');
    } finally {
      document.documentElement.classList.remove('dark');
    }
  });
});

/**
 * Gallery integration tests (#1256) covering keyboard nav (#1258),
 * analytics (#1259), and memoization surface (#1257).
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageGallery } from '../ImageGallery';
import { trackGalleryEvent } from '@/lib/galleryAnalytics';
// Boots i18next with the real translations so the gallery renders its
// translated strings instead of the raw translation keys.
import '@/test/i18n';

jest.mock('@/lib/galleryAnalytics', () => ({
  trackGalleryEvent: jest.fn(),
}));

const trackMock = trackGalleryEvent as jest.Mock;

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

jest.mock('@/components/ui/SimpleErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const images = [
  '/img/a.jpg',
  '/img/b.jpg',
  '/img/c.jpg',
  '/img/d.jpg',
];

describe('ImageGallery integration (#1256–#1259)', () => {
  beforeEach(() => {
    trackMock.mockClear();
  });

  it('renders empty state when there are no images', () => {
    render(<ImageGallery images={[]} propertyName="Empty Lot" />);
    expect(screen.getByText('No images available')).toBeInTheDocument();
  });

  it('fires gallery_view on mount', () => {
    render(<ImageGallery images={images} propertyName="Sky Villa" />);
    expect(trackMock).toHaveBeenCalledWith(
      'gallery_view',
      expect.objectContaining({ propertyName: 'Sky Villa', imageCount: 4 }),
    );
  });

  it('opens lightbox on main image click and tracks analytics', () => {
    render(<ImageGallery images={images} propertyName="Sky Villa" />);
    fireEvent.click(screen.getByLabelText('View Sky Villa main image'));
    expect(trackMock).toHaveBeenCalledWith(
      'gallery_lightbox_open',
      expect.objectContaining({ imageIndex: 0, method: 'click' }),
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('supports keyboard navigation on the main image (Enter opens)', () => {
    render(<ImageGallery images={images} propertyName="Sky Villa" />);
    const main = screen.getByLabelText('View Sky Villa main image');
    main.focus();
    fireEvent.keyDown(main, { key: 'Enter' });
    expect(trackMock).toHaveBeenCalledWith(
      'gallery_lightbox_open',
      expect.objectContaining({ method: 'keyboard' }),
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('moves focus with arrow keys on the gallery grid', () => {
    render(<ImageGallery images={images} propertyName="Sky Villa" />);
    const main = screen.getByLabelText('View Sky Villa main image');
    main.focus();
    fireEvent.keyDown(main, { key: 'ArrowRight' });
    expect(trackMock).toHaveBeenCalledWith(
      'gallery_keyboard_navigate',
      expect.objectContaining({ method: 'keyboard' }),
    );
  });

  it('closes lightbox with Escape and tracks close', () => {
    render(<ImageGallery images={images} propertyName="Sky Villa" />);
    fireEvent.click(screen.getByLabelText('View Sky Villa main image'));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(trackMock).toHaveBeenCalledWith(
      'gallery_lightbox_close',
      expect.objectContaining({ propertyName: 'Sky Villa' }),
    );
  });

  it('exports a memoized component (displayName set)', () => {
    expect(ImageGallery.displayName).toBe('ImageGallery');
  });
});

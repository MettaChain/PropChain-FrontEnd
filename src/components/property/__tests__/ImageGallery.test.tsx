import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Image from 'next/image';
import { ImageGallery } from '../ImageGallery';
import { ImageLightbox } from '../ImageLightbox';
// Boots i18next with the real translations so the gallery renders its
// translated strings instead of the raw translation keys.
import '@/test/i18n';

// Mock next/image to render a plain img so tests don't hit loader/hostname validation.
// Strip next/image-only props (priority, sizes, fill) that are not valid img attributes.
type NextImageMockProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
};

// The mock is a jest.fn so the tests can count how many images were rendered,
// which is how the memoization is observed.
jest.mock('next/image', () => ({
  __esModule: true,
  default: jest.fn(
    ({
      priority: _priority,
      fill: _fill,
      sizes: _sizes,
      ...imgProps
    }: NextImageMockProps) => <img {...imgProps} />
  ),
}));

const imageMock = Image as unknown as jest.Mock;

const images = [
  'https://images.unsplash.com/photo-1',
  'https://images.unsplash.com/photo-2',
  'https://images.unsplash.com/photo-3',
];

describe('ImageGallery', () => {
  beforeEach(() => {
    imageMock.mockClear();
  });

  it('should render the main image with the property name alt text', () => {
    render(<ImageGallery images={images} propertyName="Sunset Villa" />);

    const mainImage = screen.getByAltText('Sunset Villa');
    expect(mainImage).toBeInTheDocument();
  });

  it('should render thumbnails when there is more than one image', () => {
    render(<ImageGallery images={images} propertyName="Sunset Villa" />);

    expect(screen.getByAltText('Sunset Villa - Image 2')).toBeInTheDocument();
    expect(screen.getByAltText('Sunset Villa - Image 3')).toBeInTheDocument();
  });

  it('should open the lightbox when the main image is clicked', () => {
    render(<ImageGallery images={images} propertyName="Sunset Villa" />);

    fireEvent.click(screen.getByAltText('Sunset Villa'));

    // Lightbox opens showing image counter "1 / 3"
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    expect(screen.getByLabelText('Close lightbox')).toBeInTheDocument();
  });

  it('should open the lightbox at the correct index when a thumbnail is clicked', () => {
    render(<ImageGallery images={images} propertyName="Sunset Villa" />);

    fireEvent.click(screen.getByAltText('Sunset Villa - Image 2'));

    // Second image is shown as current (counter "2 / 3")
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('should render a placeholder when there are no images', () => {
    render(<ImageGallery images={[]} propertyName="Sunset Villa" />);

    expect(screen.getByText('No images available')).toBeInTheDocument();
    expect(screen.queryByAltText('Sunset Villa')).not.toBeInTheDocument();
  });

  // Issue #1266 — the gallery is memoized, so a re-render with unchanged
  // props must not rebuild the images.
  it('should not re-render the images when re-rendered with the same props', () => {
    const { rerender } = render(<ImageGallery images={images} propertyName="Sunset Villa" />);

    const rendersAfterMount = imageMock.mock.calls.length;
    expect(rendersAfterMount).toBeGreaterThan(0);

    rerender(<ImageGallery images={images} propertyName="Sunset Villa" />);

    expect(imageMock.mock.calls.length).toBe(rendersAfterMount);
  });

  it('should re-render the images when the property name changes', () => {
    const { rerender } = render(<ImageGallery images={images} propertyName="Sunset Villa" />);

    const rendersAfterMount = imageMock.mock.calls.length;

    rerender(<ImageGallery images={images} propertyName="Oceanview Estate" />);

    expect(imageMock.mock.calls.length).toBeGreaterThan(rendersAfterMount);
    expect(screen.getByAltText('Oceanview Estate')).toBeInTheDocument();
  });

  it('should still render every thumbnail after the memoization', () => {
    render(<ImageGallery images={images} propertyName="Sunset Villa" />);

    expect(screen.getByAltText('Sunset Villa - Image 2')).toBeInTheDocument();
    expect(screen.getByAltText('Sunset Villa - Image 3')).toBeInTheDocument();
    expect(screen.getByText('Click to view all 3 images')).toBeInTheDocument();
  });

  it('should count the images that do not fit in the thumbnail strip', () => {
    const manyImages = Array.from(
      { length: 8 },
      (_, index) => `https://images.unsplash.com/photo-${index}`
    );

    render(<ImageGallery images={manyImages} propertyName="Sunset Villa" />);

    // The main image and four thumbnails are shown, the remaining three are counted.
    expect(screen.getByText('+3')).toBeInTheDocument();
    expect(screen.getByText('Click to view all 8 images')).toBeInTheDocument();
  });
});

describe('ImageLightbox', () => {
  it('should render nothing when closed', () => {
    const { container } = render(
      <ImageLightbox
        images={images}
        isOpen={false}
        onClose={jest.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render the current image and counter when open', () => {
    render(
      <ImageLightbox
        images={images}
        initialIndex={0}
        isOpen
        onClose={jest.fn()}
      />
    );

    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    expect(screen.getByAltText('Property image 1')).toBeInTheDocument();
  });

  it('should navigate to the next image and wrap around', () => {
    render(
      <ImageLightbox
        images={images}
        initialIndex={0}
        isOpen
        onClose={jest.fn()}
      />
    );

    fireEvent.click(screen.getByLabelText('Next image'));
    expect(screen.getByText('2 / 3')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Next image'));
    expect(screen.getByText('3 / 3')).toBeInTheDocument();

    // Wraps back to the first image
    fireEvent.click(screen.getByLabelText('Next image'));
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('should navigate to the previous image and wrap around', () => {
    render(
      <ImageLightbox
        images={images}
        initialIndex={0}
        isOpen
        onClose={jest.fn()}
      />
    );

    fireEvent.click(screen.getByLabelText('Previous image'));
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
  });

  it('should jump to an image when a thumbnail is clicked', () => {
    render(
      <ImageLightbox
        images={images}
        initialIndex={0}
        isOpen
        onClose={jest.fn()}
      />
    );

    fireEvent.click(screen.getByAltText('Thumbnail 3'));
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
  });

  it('should call onClose when the close button is clicked', () => {
    const onClose = jest.fn();
    render(
      <ImageLightbox
        images={images}
        initialIndex={0}
        isOpen
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByLabelText('Close lightbox'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when the Escape key is pressed', () => {
    const onClose = jest.fn();
    render(
      <ImageLightbox
        images={images}
        initialIndex={0}
        isOpen
        onClose={onClose}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
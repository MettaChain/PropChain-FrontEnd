import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageGallery } from '../ImageGallery';
import { ImageLightbox } from '../ImageLightbox';

// Mock next/image to render a plain img so tests don't hit loader/hostname validation.
// Strip next/image-only props (priority, sizes, fill) that are not valid img attributes.
type NextImageMockProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
};

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({
    priority: _priority,
    fill: _fill,
    sizes: _sizes,
    ...imgProps
  }: NextImageMockProps) => <img {...imgProps} />,
}));

const images = [
  'https://images.unsplash.com/photo-1',
  'https://images.unsplash.com/photo-2',
  'https://images.unsplash.com/photo-3',
];

describe('ImageGallery', () => {
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
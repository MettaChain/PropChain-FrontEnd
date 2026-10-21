import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageGallery } from '../ImageGallery';
import { GALLERY_MAX_IMAGES } from '@/lib/galleryValidation';
import '@/test/i18n';

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

const validImage = 'https://images.unsplash.com/photo-1';
const secondImage = 'https://images.unsplash.com/photo-2';

describe('ImageGallery validation', () => {
  it('renders only the images that pass validation', () => {
    render(
      <ImageGallery
        images={[validImage, 'not a url', secondImage]}
        propertyName="Sunset Villa"
      />
    );

    expect(screen.getByAltText('Sunset Villa')).toHaveAttribute('src', validImage);
    expect(screen.getByAltText('Sunset Villa - Image 2')).toHaveAttribute('src', secondImage);
  });

  it('reports the entries that were skipped and why', () => {
    render(
      <ImageGallery
        images={[validImage, 'images/photo-2.jpg', '']}
        propertyName="Sunset Villa"
      />
    );

    const notice = screen.getByRole('status');
    expect(notice).toHaveTextContent('Some images could not be displayed');
    expect(
      notice.querySelector('li')?.parentElement?.children
    ).toHaveLength(2);
    expect(screen.getByText(/not a valid http\(s\) address or site path/i)).toBeInTheDocument();
    expect(screen.getByText(/had an empty address/i)).toBeInTheDocument();
  });

  it('reports a duplicated address once', () => {
    render(
      <ImageGallery
        images={[validImage, validImage]}
        propertyName="Sunset Villa"
      />
    );

    expect(screen.getAllByText(/listed more than once/i)).toHaveLength(1);
    expect(screen.getByAltText('Sunset Villa')).toBeInTheDocument();
  });

  it('shows the empty state when every image was rejected', () => {
    render(<ImageGallery images={['not a url']} propertyName="Sunset Villa" />);

    expect(screen.getByText('No images available')).toBeInTheDocument();
    expect(screen.queryByAltText('Sunset Villa')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Some images could not be displayed'
    );
  });

  it('does not show a notice when every image is valid', () => {
    render(<ImageGallery images={[validImage]} propertyName="Sunset Villa" />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('reports the images that did not fit into the maximum', () => {
    const images = Array.from(
      { length: GALLERY_MAX_IMAGES + 2 },
      (_unused, index) => `https://images.unsplash.com/photo-${index}`
    );

    render(<ImageGallery images={images} propertyName="Sunset Villa" />);

    expect(
      screen.getByText(
        `2 images are not shown because a gallery holds at most ${GALLERY_MAX_IMAGES} images.`
      )
    ).toBeInTheDocument();
  });

  it('opens the lightbox with the validated images only', () => {
    render(
      <ImageGallery
        images={[validImage, 'not a url', secondImage]}
        propertyName="Sunset Villa"
      />
    );

    fireEvent.click(screen.getByAltText('Sunset Villa'));

    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });
});

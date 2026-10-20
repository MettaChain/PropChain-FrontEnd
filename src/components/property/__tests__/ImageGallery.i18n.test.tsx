import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ImageGallery } from '../ImageGallery';
import i18n, { testResources } from '@/test/i18n';
import arTranslations from '@/locales/ar/common.json';
import deTranslations from '@/locales/de/common.json';
import enTranslations from '@/locales/en/common.json';
import esTranslations from '@/locales/es/common.json';
import frTranslations from '@/locales/fr/common.json';
import heTranslations from '@/locales/he/common.json';
import zhTranslations from '@/locales/zh/common.json';

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
];

afterEach(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

describe('ImageGallery translations', () => {
  it('renders the translated empty state', () => {
    render(<ImageGallery images={[]} propertyName="Sunset Villa" />);

    expect(screen.getByText('No images available')).toBeInTheDocument();
    expect(
      screen.getByText('This property has no photos yet.')
    ).toBeInTheDocument();
  });

  it('renders the translated alternative text', () => {
    render(<ImageGallery images={images} propertyName="Sunset Villa" />);

    expect(screen.getByAltText('Sunset Villa')).toBeInTheDocument();
    expect(screen.getByAltText('Sunset Villa - Image 2')).toBeInTheDocument();
  });

  it('renders the translated lightbox', () => {
    render(<ImageGallery images={images} propertyName="Sunset Villa" />);

    fireEvent.click(screen.getByAltText('Sunset Villa'));

    expect(screen.getByLabelText('Close lightbox')).toBeInTheDocument();
    expect(screen.getByLabelText('Next image')).toBeInTheDocument();
    expect(screen.getByLabelText('Previous image')).toBeInTheDocument();
    expect(screen.getByAltText('Property image 1')).toBeInTheDocument();
    expect(screen.getByAltText('Thumbnail 1')).toBeInTheDocument();
  });

  it('uses the singular form for a single image', () => {
    render(<ImageGallery images={[images[0]]} propertyName="Sunset Villa" />);

    expect(
      screen.getByText('Click to view all 1 image')
    ).toBeInTheDocument();
  });

  it('uses the plural form for several images', () => {
    render(<ImageGallery images={images} propertyName="Sunset Villa" />);

    expect(
      screen.getByText('Click to view all 2 images')
    ).toBeInTheDocument();
  });

  it('falls back to a generic name when the property has no name', () => {
    render(<ImageGallery images={images} propertyName="   " />);

    expect(screen.getByAltText('Property')).toBeInTheDocument();
    expect(screen.getByAltText('Property - Image 2')).toBeInTheDocument();
  });

  it('renders the gallery in the selected language', async () => {
    render(<ImageGallery images={[]} propertyName="Sunset Villa" />);

    await act(async () => {
      await i18n.changeLanguage('es');
    });

    await waitFor(() => {
      expect(screen.getByText('No hay imágenes disponibles')).toBeInTheDocument();
    });
  });
});

describe('gallery translations', () => {
  const galleryKeys = (translations: { gallery: Record<string, unknown> }) =>
    Object.keys(translations.gallery).sort();

  it('ships the same gallery keys in every language', () => {
    const expected = galleryKeys(enTranslations);

    expect(galleryKeys(esTranslations)).toEqual(expected);
    expect(galleryKeys(frTranslations)).toEqual(expected);
    expect(galleryKeys(deTranslations)).toEqual(expected);
    expect(galleryKeys(zhTranslations)).toEqual(expected);
    expect(galleryKeys(arTranslations)).toEqual(expected);
    expect(galleryKeys(heTranslations)).toEqual(expected);
  });

  it('keeps the gallery section in the resources the test helper loads', () => {
    Object.entries(testResources).forEach(([locale, namespaces]) => {
      expect(
        (namespaces.common as { gallery?: unknown }).gallery
      ).toBeDefined();
    });
  });
});

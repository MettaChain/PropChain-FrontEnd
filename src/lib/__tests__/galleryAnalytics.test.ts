import { trackGalleryEvent } from '../galleryAnalytics';

describe('galleryAnalytics (#1259)', () => {
  beforeEach(() => {
    (window as any).dataLayer = [];
    (window as any).gtag = jest.fn();
  });

  afterEach(() => {
    delete (window as any).gtag;
  });

  it('pushes events to dataLayer and gtag', () => {
    trackGalleryEvent('gallery_lightbox_open', {
      propertyName: 'Villa',
      imageIndex: 1,
      imageCount: 4,
      method: 'click',
    });
    expect((window as any).dataLayer.length).toBeGreaterThan(0);
    expect((window as any).dataLayer[0]).toMatchObject({
      event: 'gallery_lightbox_open',
      category: 'gallery',
      propertyName: 'Villa',
    });
    expect((window as any).gtag).toHaveBeenCalledWith(
      'event',
      'gallery_lightbox_open',
      expect.objectContaining({ event_category: 'gallery' }),
    );
  });

  it('does not throw when gtag is missing', () => {
    delete (window as any).gtag;
    expect(() =>
      trackGalleryEvent('gallery_view', { imageCount: 0 }),
    ).not.toThrow();
  });
});

# ImageGallery

`ImageGallery` (`src/components/property/ImageGallery.tsx`) renders the photo
strip of a property: one large image, up to four thumbnails, an overflow
counter and the full-screen lightbox.

```tsx
<ImageGallery images={property.images} propertyName={property.name} />
```

## Behaviour

- The first image is the main image and opens the lightbox on click. Every
  thumbnail opens the lightbox on the image it represents.
- Up to four thumbnails are shown (`images.slice(1, 5)`). When the property has
  more than five images, the overflow counter shows how many are left
  (`+{images.length - 5}`).
- An empty (or missing) `images` list renders the "No images available"
  placeholder instead of the strip.
- The main image is covered by a decorative skeleton until the browser reports
  that it has loaded, so a slow image does not leave an empty grey box.
- The whole gallery is wrapped in the shared `ErrorBoundary`, so a failure in
  the strip or in the lightbox degrades to a retryable fallback instead of
  taking the property page down.

## Re-render model

The gallery lives inside the property detail view, which re-renders for
reasons unrelated to the photos (the currency toggle, a parent state change).
The gallery is built so that those re-renders do not walk the photo tree:

- **`ImageGallery`** is wrapped in `React.memo`. React skips the whole
  gallery when `images` and `propertyName` are unchanged, so the `next/image`
  elements are not re-created.
- **`GalleryThumbnail`** is a memoized component of its own. A thumbnail only
  depends on its image, its alt text and the (stable) open handler, so a
  re-render that leaves a thumbnail's props alone does not re-render it.
- **Derived values** — the image list, the thumbnail slice and the overflow
  count — are computed with `useMemo`, keyed on the image list. They are not
  recomputed on every render.
- **`openLightbox` / `closeLightbox`** are `useCallback`s, so the lightbox
  keeps the same handler identity across renders.

`React.memo` compares the props shallowly: pass the same array reference to
get the benefit. A freshly built array (`property.images.filter(...)` in the
render body) is a new reference on every render and re-renders the gallery.

## Tests

- `src/components/property/__tests__/ImageGallery.test.tsx`: the main image,
  the thumbnails, the lightbox, the empty state, the overflow counter, and
  the memoization (a re-render with unchanged props does not re-render the
  images, a changed property name does).

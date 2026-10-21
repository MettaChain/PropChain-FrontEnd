# Gallery

`src/components/gallery/Gallery.tsx` provides the shared client-side Gallery
(issues #1260–#1263). Import `Gallery` and its exported `GalleryProps` type
from `@/components/gallery/Gallery`.

```tsx
<Gallery
  images={['/photos/exterior.jpg', '/photos/interior.jpg']}
  label="Sunset Villa"
  emptyTitle="No photos yet"
  emptyDescription="Photos will appear here when they are added."
/>
```

`images` is a required readonly array of URL strings, in display order; use `[]`
when empty. `label` is a required accessible collection name and image description.
`emptyTitle` and `emptyDescription` are optional strings. The default empty state
explains that images will appear when added, has a decorative icon and a status
region, and offers no inactive controls. The property `ImageGallery` adapter keeps
the existing `images` / `propertyName` API and supplies property-specific copy.

The main image, thumbnails and more-images control are native buttons with focus
rings. The more-images button opens the first image beyond the preview. Escape
closes the lightbox; arrow keys navigate it. Replacing the image collection resets
loading and lightbox state. Rendering errors stay inside the existing error boundary.

Gallery surfaces, text, borders and focus rings use the application's semantic
Tailwind tokens (`background`, `foreground`, `muted`, `border`, `ring`, `accent`).
They follow the existing `.dark` theme without a separate toggle or theme state.
The lightbox uses a deliberately dark viewing surface in either theme.

Validation: `npm test -- --runInBand ImageGallery Gallery`, `npm run typecheck`,
and `npm run lint`. The tests cover empty/populated states, keyboard interaction,
lightbox indices, reuse, theme-token integration and collection replacement.
The type assertions in `Gallery.types.ts` are checked by `npm run typecheck`.

# Gallery

`ImageGallery` (`src/components/property/ImageGallery.tsx`) renders the photos of a
property: one large image, a strip of thumbnails and the `ImageLightbox` that opens
over them. It is rendered by `PropertyDetailServer` from `property.images`.

```tsx
<ImageGallery
  images={property.images}   // the image list, straight from the API
  propertyName={property.name} // used as the alternative text of every image
/>
```

The component is a client component: it holds the lightbox state and the loading
skeleton of the main image.

## Validation

The image list reaches the browser from the API, so it is validated before
anything is rendered. The rules live in `src/lib/galleryValidation.ts` and are
implemented with a zod schema (`galleryImageSchema`) plus a cross entry check for
duplicates:

| Rule | Reason code | What happens |
| --- | --- | --- |
| The entry is text | `notAString` | The entry is skipped |
| The entry is not empty once trimmed | `empty` | The entry is skipped |
| The entry is an `http(s)` URL or a path that starts with `/` | `invalidSource` | The entry is skipped |
| The address was already used | `duplicate` | The entry is skipped |
| The gallery is longer than `GALLERY_MAX_IMAGES` (50) | — | The extra images are not rendered and counted |

`next/image` only accepts an absolute `http(s)` URL or a path that starts with a
slash, so a relative path without the leading slash and a `data:` URL are rejected
before they can turn into a broken image.

Every rejected entry is reported to the user in a `role="status"` notice above the
gallery, together with the reason it was skipped. A gallery whose images are all
invalid shows that notice and the empty state.

`validateGalleryImages` returns the renderable images, the rejected entries with
their reason and the number of images that did not fit into the maximum:

```ts
const { images, issues, droppedCount } = validateGalleryImages(property.images)
```

## Translations

Every string the gallery renders comes from the `gallery` section of the `common`
namespace (`src/locales/<locale>/common.json`). All seven shipped languages carry
the same keys, which the translation completeness test enforces.

| Key | Used for |
| --- | --- |
| `gallery.label` | Accessible name of the gallery |
| `gallery.noImages` | Empty state headline |
| `gallery.noImagesDescription` | Empty state explanation |
| `gallery.viewAll` | Overlay on the main image, pluralised on the image count |
| `gallery.moreImages` | The "more images" tile under the thumbnails |
| `gallery.imageAlt` | Alternative text of a thumbnail |
| `gallery.mainImageAlt` | Alternative text of the main image |
| `gallery.defaultPropertyName` | Fallback when the property has no name |
| `gallery.lightboxLabel` | Accessible name of the lightbox dialog |
| `gallery.lightboxImageAlt` | Alternative text of the lightbox image |
| `gallery.thumbnailAlt` | Alternative text of a lightbox thumbnail |
| `gallery.closeLightbox` | Accessible name of the close button |
| `gallery.previousImage` | Accessible name of the previous button |
| `gallery.nextImage` | Accessible name of the next button |
| `gallery.counter` | The "1 / 3" position indicator |
| `gallery.invalidImagesTitle` | Headline of the validation notice |
| `gallery.imagesDropped` | How many images were not rendered |
| `gallery.issue.*` | The reason an entry was skipped |

Counted strings use the i18next plural form (`key` plus `key_one`), and the base
key is kept as well so languages with more plural categories than English — Arabic
and Hebrew — still resolve to a sentence instead of a raw key.

## Tests

- `src/components/property/__tests__/ImageGallery.test.tsx`: rendering, thumbnails
  and the lightbox.
- `src/components/property/__tests__/ImageGallery.validation.test.tsx`: which images
  are rendered, which are skipped and what the user is told about it.
- `src/components/property/__tests__/ImageGallery.i18n.test.tsx`: the translated
  strings, the plural forms and the key parity between the languages.
- `src/lib/__tests__/galleryValidation.test.ts`: the validation rules themselves.

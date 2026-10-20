# Property Image Gallery

Covers issues **#1256–#1259**.

## Features

| Issue | Behavior |
| --- | --- |
| #1259 Analytics | `trackGalleryEvent` → gtag + `dataLayer` (`gallery_view`, open/close/navigate, keyboard) |
| #1258 Keyboard | Arrow/Home/End focus movement; Enter/Space opens lightbox; lightbox already supports ←/→/Esc |
| #1257 Re-renders | `React.memo` on gallery shells; `useCallback` / `useMemo` for handlers and thumbnail list |
| #1256 Tests | `ImageGallery.integration.test.tsx`, `galleryAnalytics.test.ts` |

## Usage

```tsx
import { ImageGallery } from '@/components/property/ImageGallery';

<ImageGallery images={urls} propertyName={property.title} />
```

## Analytics payload

Events include optional `propertyName`, `imageIndex`, `imageCount`, `direction`, `method`.

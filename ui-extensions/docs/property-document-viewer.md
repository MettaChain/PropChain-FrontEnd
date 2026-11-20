# Property Document Viewer

`PropertyDocumentViewer` displays PDF, image (JPG, PNG, or WebP), and text
(TXT, Markdown, or CSV) property documents. It provides downloads, print
support, and zoom controls for PDFs and images.

```tsx
import PropertyDocumentViewer from '../components/PropertyDocumentViewer';

<PropertyDocumentViewer
  src="https://example.com/property-deed.pdf"
  fileName="property-deed.pdf"
  pageCount={12}
/>;
```

The viewer uses the browser's built-in PDF renderer, so it does not add a PDF
dependency. Provide `pageCount` when it is known to show the full page count,
bound next-page navigation, and constrain page jumps. Without it, the viewer
shows the current page with an unknown total and still supports direct page
jumps. The PDF browser viewer must support the standard `page` and `zoom`
fragment parameters for the navigation and zoom controls to take effect.

Document type is inferred from the file name or URL extension. Set `fileType`
to `'pdf'`, `'image'`, or `'text'` when the URL does not include a supported
extension. Text files are fetched by the browser and therefore must be
available to the page under the server's CORS policy.

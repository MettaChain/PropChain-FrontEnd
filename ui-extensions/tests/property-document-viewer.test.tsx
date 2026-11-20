import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import PropertyDocumentViewer from '../components/PropertyDocumentViewer';

describe('PropertyDocumentViewer', () => {
  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'fetch');
  });

  it('navigates and zooms PDF pages, constraining navigation to the page count', () => {
    render(
      <PropertyDocumentViewer
        src="https://example.com/deed.pdf"
        fileName="deed.pdf"
        pageCount={3}
      />,
    );

    expect(screen.getByTitle('PDF: deed.pdf')).toHaveAttribute(
      'src',
      expect.stringContaining('#page=1&zoom=page-width'),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(screen.getByTitle('PDF: deed.pdf')).toHaveAttribute(
      'src',
      expect.stringContaining('#page=2&zoom=page-width'),
    );

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Jump to page' }), {
      target: { value: '3' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Go' }));
    expect(screen.getByTitle('PDF: deed.pdf')).toHaveAttribute(
      'src',
      expect.stringContaining('#page=3&zoom=page-width'),
    );
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(screen.getByTitle('PDF: deed.pdf')).toHaveAttribute(
      'src',
      expect.stringContaining('#page=3&zoom=110'),
    );
  });

  it('renders images with download and zoom controls', () => {
    render(
      <PropertyDocumentViewer
        src="https://example.com/photo.webp"
        fileName="property-photo.webp"
      />,
    );

    expect(screen.getByRole('img', { name: 'property-photo.webp' })).toHaveAttribute(
      'src',
      'https://example.com/photo.webp',
    );
    expect(screen.getByRole('link', { name: 'Download' })).toHaveAttribute(
      'download',
      'property-photo.webp',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(screen.getByRole('img', { name: 'property-photo.webp' })).toHaveStyle({
      width: '110%',
    });
  });

  it('loads and displays text documents', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => null },
      body: null,
      text: async () => 'Property details',
    });
    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      value: fetchMock,
    });

    render(
      <PropertyDocumentViewer
        src="https://example.com/property.txt"
        fileName="property.txt"
      />,
    );

    expect(await screen.findByText('Property details')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.com/property.txt',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });
});

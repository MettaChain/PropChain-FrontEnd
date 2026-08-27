import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PdfViewerModal from '../PdfViewerModal';
import type { PropertyDocument } from '../PdfViewerModal';

// Mock react-pdf with a configurable Document so we can exercise load and error states.
const mockDocument = jest.fn(
  (props: {
    file?: string;
    onLoadSuccess?: () => void;
    onError?: () => void;
    children?: React.ReactNode;
  }) => {
    return {
      file: props.file,
      onLoadSuccess: props.onLoadSuccess,
      onError: props.onError,
      children: props.children,
    };
  }
);

// react-pdf is not a declared dependency yet, so mock it as virtual to avoid resolution errors.
jest.mock('react-pdf', () => ({
  Document: (props: {
    file?: string;
    onLoadSuccess?: () => void;
    onError?: () => void;
    children?: React.ReactNode;
  }) => {
    mockDocument(props);
    return (
      <div data-testid="pdf-document" data-fail={props.file === 'https://example.com/broken.pdf' ? 'true' : 'false'}>
        {props.children}
      </div>
    );
  },
  Page: () => <div data-testid="pdf-page" />,
}), { virtual: true });

const mockDoc: PropertyDocument = {
  id: 'doc-1',
  name: 'Property Deed',
  url: 'https://example.com/deed.pdf',
  category: 'Legal',
  verified: true,
};

describe('PdfViewerModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the modal shell with a close button when open', () => {
    render(<PdfViewerModal doc={mockDoc} onClose={jest.fn()} />);

    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });

  it('should pass the document url to the PDF Document component', () => {
    render(<PdfViewerModal doc={mockDoc} onClose={jest.fn()} />);

    expect(mockDocument).toHaveBeenCalledTimes(1);
    expect(mockDocument.mock.calls[0][0].file).toBe(mockDoc.url);
  });

  it('should render the PDF page when a document is provided', () => {
    render(<PdfViewerModal doc={mockDoc} onClose={jest.fn()} />);

    expect(screen.getByTestId('pdf-page')).toBeInTheDocument();
  });

  it('should call onClose when the close button is clicked', () => {
    const onClose = jest.fn();
    render(<PdfViewerModal doc={mockDoc} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should render the modal and keep the close button available even on a failing document', () => {
    const brokenDoc: PropertyDocument = { ...mockDoc, url: 'https://example.com/broken.pdf' };
    const onClose = jest.fn();
    render(<PdfViewerModal doc={brokenDoc} onClose={onClose} />);

    // The modal shell stays mounted so the user can always dismiss it
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    expect(screen.getByTestId('pdf-document')).toHaveAttribute('data-fail', 'true');

    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DocumentSection from '../DocumentSection';
import type { PropertyDocument } from '../PdfViewerModal';

// PdfViewerModal pulls in react-pdf, which is not installed, so we stub the
// modal surface and assert on the props it receives.
jest.mock('../PdfViewerModal', () => ({
  __esModule: true,
  default: ({
    doc,
    onClose,
  }: {
    doc: PropertyDocument;
    onClose: () => void;
  }) => (
    <div data-testid="pdf-viewer-modal">
      <span>Viewing: {doc.name}</span>
      <button onClick={onClose}>Close modal</button>
    </div>
  ),
}));

const documents: PropertyDocument[] = [
  {
    id: 'doc-1',
    name: 'Title Deed.pdf',
    url: '/docs/title-deed.pdf',
    category: 'Legal',
    verified: true,
  },
  {
    id: 'doc-2',
    name: 'Inspection Report.pdf',
    url: '/docs/inspection.pdf',
    category: 'Inspection',
    verified: false,
  },
];

describe('DocumentSection', () => {
  it('renders a heading per category that has documents', () => {
    render(<DocumentSection documents={documents} />);

    expect(screen.getByRole('heading', { name: 'Legal' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Inspection' })
    ).toBeInTheDocument();
  });

  it('does not render headings for categories without documents', () => {
    render(<DocumentSection documents={documents} />);

    expect(
      screen.queryByRole('heading', { name: 'Financial' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Photos' })
    ).not.toBeInTheDocument();
  });

  it('renders every document name under its category', () => {
    render(<DocumentSection documents={documents} />);

    expect(screen.getByText('Title Deed.pdf')).toBeInTheDocument();
    expect(screen.getByText('Inspection Report.pdf')).toBeInTheDocument();
  });

  it('shows the verification state for each document', () => {
    render(<DocumentSection documents={documents} />);

    expect(screen.getByText('Verified')).toBeInTheDocument();
    expect(screen.getByText('Pending Verification')).toBeInTheDocument();
  });

  it('renders a download link pointing at the document url', () => {
    render(<DocumentSection documents={documents} />);

    const downloads = screen.getAllByRole('link', { name: 'Download' });
    expect(downloads).toHaveLength(2);
    expect(downloads[0]).toHaveAttribute('href', '/docs/title-deed.pdf');
    expect(downloads[0]).toHaveAttribute('download');
    expect(downloads[1]).toHaveAttribute('href', '/docs/inspection.pdf');
  });

  it('opens the pdf viewer modal with the selected document', () => {
    render(<DocumentSection documents={documents} />);

    expect(
      screen.queryByTestId('pdf-viewer-modal')
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'View' })[0]);

    expect(screen.getByTestId('pdf-viewer-modal')).toBeInTheDocument();
    expect(
      screen.getByText('Viewing: Title Deed.pdf')
    ).toBeInTheDocument();
  });

  it('closes the modal when the close action is triggered', () => {
    render(<DocumentSection documents={documents} />);

    fireEvent.click(screen.getAllByRole('button', { name: 'View' })[0]);
    expect(screen.getByTestId('pdf-viewer-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close modal' }));
    expect(
      screen.queryByTestId('pdf-viewer-modal')
    ).not.toBeInTheDocument();
  });

  it('renders nothing when there are no documents', () => {
    const { container } = render(<DocumentSection documents={[]} />);

    expect(container.querySelector('section')).not.toBeInTheDocument();
    expect(container.textContent).toBe('');
  });
});

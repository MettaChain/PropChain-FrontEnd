import { Document, Page } from "react-pdf";

export type PropertyDocument = {
  id: string;
  name: string;
  url: string;
  category: "Legal" | "Financial" | "Inspection" | "Photos";
  verified: boolean;
};

type PdfViewerModalProps = {
  doc: PropertyDocument;
  onClose: () => void;
};

export default function PdfViewerModal({
  doc,
  onClose,
}: PdfViewerModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 grid place-items-center z-50">
      <div className="bg-white p-4 rounded-2xl w-[90vw] h-[90vh] overflow-auto">
        <button
          onClick={onClose}
          className="mb-4 rounded bg-gray-200 px-4 py-2"
        >
          Close
        </button>

        <Document file={doc.url}>
          <Page pageNumber={1} />
        </Document>
      </div>
    </div>
  );
}
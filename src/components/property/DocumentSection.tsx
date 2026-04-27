import { useState } from "react";
import PdfViewerModal, { PropertyDocument } from "./PdfViewerModal";
import VerificationBadge from "./VerificationBadge";

type Props = {
  documents: PropertyDocument[];
};

export default function DocumentSection({ documents }: Props) {
  const [selected, setSelected] = useState<PropertyDocument | null>(null);

  const categories: PropertyDocument["category"][] = [
    "Legal",
    "Financial",
    "Inspection",
    "Photos",
  ];

  return (
    <div className="space-y-6">
      {categories.map((category) => {
        const docs = documents.filter(
          (d: PropertyDocument) => d.category === category
        );

        if (!docs.length) return null;

        return (
          <section key={category}>
            <h3 className="text-lg font-semibold mb-3">{category}</h3>

            <div className="space-y-2">
              {docs.map((doc: PropertyDocument) => (
                <div
                  key={doc.id}
                  className="border rounded-xl p-4 flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <VerificationBadge verified={doc.verified} />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelected(doc)}
                      className="rounded bg-blue-600 text-white px-3 py-1"
                    >
                      View
                    </button>

                    <a
                      href={doc.url}
                      download
                      className="rounded bg-gray-200 px-3 py-1"
                    >
                      Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {selected && (
        <PdfViewerModal
          doc={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

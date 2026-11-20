'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';

export type PropertyDocumentType = 'pdf' | 'image' | 'text';

export interface PropertyDocumentViewerProps {
  src: string;
  fileName?: string;
  fileType?: PropertyDocumentType;
  pageCount?: number;
  className?: string;
}

type Zoom = number | 'fit';

function inferFileType(src: string, fileName?: string): PropertyDocumentType | null {
  const file = (fileName ?? src).split(/[?#]/, 1)[0].toLowerCase();

  if (file.endsWith('.pdf')) return 'pdf';
  if (/\.(jpe?g|png|webp)$/.test(file)) return 'image';
  if (/\.(txt|md|csv)$/.test(file)) return 'text';

  return null;
}

function getFileName(src: string, fileName?: string): string {
  return fileName ?? src.split(/[?#]/, 1)[0].split('/').pop() ?? 'property-document';
}

export default function PropertyDocumentViewer({
  src,
  fileName,
  fileType,
  pageCount,
  className = '',
}: PropertyDocumentViewerProps) {
  const type = fileType ?? inferFileType(src, fileName);
  const effectivePageCount =
    Number.isInteger(pageCount) && pageCount !== undefined && pageCount > 0
      ? pageCount
      : undefined;
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [zoom, setZoom] = useState<Zoom>('fit');
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState('');
  const pageInputId = useId();
  const pdfFrame = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setPage(1);
    setPageInput('1');
    setZoom('fit');
    setError(null);
    setProgress(null);
    setText('');
    setLoading(true);

    if (!type) {
      setError('Unsupported document type. Use a PDF, JPG, PNG, WebP, or text file.');
      setLoading(false);
      return;
    }

    if (type !== 'text') return;

    const controller = new AbortController();

    async function loadText() {
      try {
        const response = await fetch(src, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Unable to load document (${response.status}).`);
        }

        const contentLength = Number(response.headers.get('content-length'));
        const total = Number.isFinite(contentLength) && contentLength > 0
          ? contentLength
          : null;

        if (!response.body) {
          setText(await response.text());
          setProgress(100);
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let loaded = 0;
        let content = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          loaded += value.byteLength;
          content += decoder.decode(value, { stream: true });
          if (total) setProgress(Math.min(Math.round((loaded / total) * 100), 100));
        }

        content += decoder.decode();
        setText(content);
        setProgress(100);
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setError(loadError instanceof Error ? loadError.message : 'Unable to load document.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadText();
    return () => controller.abort();
  }, [src, type]);

  const updateZoom = (amount: number) => {
    setZoom((current) => {
      const currentScale = current === 'fit' ? 100 : current;
      return Math.min(200, Math.max(50, currentScale + amount));
    });
  };

  const jumpToPage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const requestedPage = Number(pageInput);
    if (!Number.isInteger(requestedPage) || requestedPage < 1) {
      setPageInput(String(page));
      return;
    }

    const nextPage = effectivePageCount
      ? Math.min(requestedPage, effectivePageCount)
      : requestedPage;
    setPage(nextPage);
    setPageInput(String(nextPage));
  };

  const printDocument = () => {
    if (type === 'pdf') {
      pdfFrame.current?.contentWindow?.focus();
      pdfFrame.current?.contentWindow?.print();
      return;
    }

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      setError('Allow pop-ups for this site to print the document.');
      return;
    }

    const print = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.onafterprint = () => printWindow.close();
    };

    printWindow.document.title = getFileName(src, fileName);
    const style = printWindow.document.createElement('style');
    style.textContent = 'body { margin: 1rem; } img { display: block; max-width: 100%; } pre { white-space: pre-wrap; overflow-wrap: anywhere; }';
    printWindow.document.head.append(style);

    if (type === 'image') {
      const image = printWindow.document.createElement('img');
      image.alt = getFileName(src, fileName);
      image.onload = print;
      image.onerror = () => {
        printWindow.close();
        setError('Unable to load the image for printing.');
      };
      printWindow.document.body.append(image);
      image.src = src;
      return;
    }

    const content = printWindow.document.createElement('pre');
    content.textContent = text;
    printWindow.document.body.append(content);
    print();
  };

  const pdfSrc = type === 'pdf'
    ? `${src.split('#', 1)[0]}#page=${page}&zoom=${zoom === 'fit' ? 'page-width' : zoom}`
    : undefined;

  return (
    <section
      aria-label={`Document viewer: ${getFileName(src, fileName)}`}
      className={`rounded-lg border border-gray-300 bg-white text-gray-900 ${className}`}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-3">
        <h2 className="min-w-0 truncate font-medium">{getFileName(src, fileName)}</h2>
        <div className="flex flex-wrap items-center gap-2">
          {type === 'pdf' && (
            <>
              <button
                type="button"
                onClick={() => {
                  const nextPage = Math.max(1, page - 1);
                  setPage(nextPage);
                  setPageInput(String(nextPage));
                }}
                disabled={page <= 1}
                className="rounded border px-2 py-1 disabled:opacity-50"
                aria-label="Previous page"
              >
                Previous
              </button>
              <form onSubmit={jumpToPage} className="flex items-center gap-1">
                <label htmlFor={pageInputId} className="text-sm">Page</label>
                <input
                  id={pageInputId}
                  type="number"
                  min={1}
                  max={effectivePageCount}
                  value={pageInput}
                  onChange={(event) => setPageInput(event.target.value)}
                  className="w-16 rounded border px-2 py-1"
                  aria-label="Jump to page"
                />
                <span aria-live="polite">
                  of {effectivePageCount ?? '?'}
                </span>
                <button type="submit" className="rounded border px-2 py-1">
                  Go
                </button>
              </form>
              <button
                type="button"
                onClick={() => {
                  const nextPage = page + 1;
                  setPage(nextPage);
                  setPageInput(String(nextPage));
                }}
                disabled={effectivePageCount !== undefined && page >= effectivePageCount}
                className="rounded border px-2 py-1 disabled:opacity-50"
                aria-label="Next page"
              >
                Next
              </button>
            </>
          )}
          {type !== 'text' && (
            <>
              <button type="button" onClick={() => updateZoom(-10)} className="rounded border px-2 py-1" aria-label="Zoom out">
                −
              </button>
              <span className="min-w-16 text-center text-sm" aria-live="polite">
                {zoom === 'fit' ? 'Fit width' : `${zoom}%`}
              </span>
              <button type="button" onClick={() => updateZoom(10)} className="rounded border px-2 py-1" aria-label="Zoom in">
                +
              </button>
              <button type="button" onClick={() => setZoom('fit')} className="rounded border px-2 py-1">
                Fit to width
              </button>
            </>
          )}
          <a
            href={src}
            download={getFileName(src, fileName)}
            className="rounded border px-2 py-1"
          >
            Download
          </a>
          <button type="button" onClick={printDocument} className="rounded border px-2 py-1">
            Print
          </button>
        </div>
      </header>

      {loading && (
        <div role="status" aria-live="polite" className="space-y-1 p-3">
          <span>{progress === null ? 'Loading document…' : `Loading document… ${progress}%`}</span>
          <progress
            aria-label="Document loading progress"
            max={100}
            value={progress ?? undefined}
            className="block h-2 w-full"
          />
        </div>
      )}
      {error && <p role="alert" className="p-3 text-red-700">{error}</p>}

      <div className="max-h-[75vh] min-h-64 overflow-auto bg-gray-100 p-4">
        {type === 'pdf' && pdfSrc && (
          <iframe
            ref={pdfFrame}
            key={pdfSrc}
            title={`PDF: ${getFileName(src, fileName)}`}
            src={pdfSrc}
            onLoad={() => setLoading(false)}
            onError={() => {
              setError('Unable to load this PDF.');
              setLoading(false);
            }}
            className="h-[70vh] min-h-96 w-full border-0 bg-white"
          />
        )}
        {type === 'image' && (
          <img
            src={src}
            alt={getFileName(src, fileName)}
            onLoad={() => setLoading(false)}
            onError={() => {
              setError('Unable to load this image.');
              setLoading(false);
            }}
            style={{
              width: zoom === 'fit' ? '100%' : `${zoom}%`,
              maxWidth: zoom === 'fit' ? '100%' : undefined,
            }}
            className="mx-auto h-auto"
          />
        )}
        {type === 'text' && !loading && !error && (
          <pre className="whitespace-pre-wrap break-words rounded bg-white p-4 text-sm">
            {text}
          </pre>
        )}
      </div>
    </section>
  );
}

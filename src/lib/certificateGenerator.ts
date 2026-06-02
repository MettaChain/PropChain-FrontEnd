import type { NFTCertificate } from '@/types/certificate';

/**
 * Captures a DOM element as a PNG blob using html2canvas.
 * Returns null if html2canvas is unavailable (SSR).
 */
export async function captureCertificateAsPng(
  element: HTMLElement
): Promise<Blob | null> {
  if (typeof window === 'undefined') return null;
  const { default: html2canvas } = await import('html2canvas');
  const canvas = await html2canvas(element, { useCORS: true, scale: 2 });
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
}

/**
 * Downloads a certificate element as a PNG file.
 */
export async function downloadCertificatePng(
  element: HTMLElement,
  filename: string
): Promise<void> {
  const blob = await captureCertificateAsPng(element);
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.png`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Downloads a certificate element as a PDF file.
 */
export async function downloadCertificatePdf(
  element: HTMLElement,
  filename: string
): Promise<void> {
  const blob = await captureCertificateAsPng(element);
  if (!blob) return;
  const { jsPDF } = await import('jspdf');
  const imgData = await blobToDataUrl(blob);
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [800, 500] });
  pdf.addImage(imgData, 'PNG', 0, 0, 800, 500);
  pdf.save(`${filename}.pdf`);
}

/**
 * Generates a Twitter share URL for a certificate.
 */
export function getCertificateShareUrl(cert: NFTCertificate): string {
  const text = encodeURIComponent(
    `I just purchased ${cert.tokenAmount} ${cert.tokenSymbol} tokens of ${cert.propertyName} on PropChain! 🏠🔗`
  );
  return `https://twitter.com/intent/tweet?text=${text}`;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

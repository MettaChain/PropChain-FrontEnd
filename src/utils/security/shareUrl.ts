const SAFE_STRING_REGEX = /[^a-zA-Z0-9\s\-'.,!?()%+]/g;
const MAX_STRING_LENGTH = 200;

export function sanitizeDisplayString(value: string): string {
  if (!value) return '';
  const truncated = value.slice(0, MAX_STRING_LENGTH);
  return truncated.replace(SAFE_STRING_REGEX, '').trim();
}

export function buildPropertyShareUrl(property: {
  id: string;
  name: string;
  location: { city: string; state: string };
  metrics: { roi: number };
  price: { total: number };
}): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const urlStr = `${origin}/properties/${encodeURIComponent(property.id)}`;

  let url: URL;
  try {
    url = new URL(urlStr);
  } catch {
    return '';
  }

  if (origin && url.origin !== origin) {
    return '';
  }

  return url.href;
}

export function buildShareText(property: {
  name: string;
  location: { city: string; state: string };
  metrics: { roi: number };
  price: { total: number };
}): string {
  const safeName = sanitizeDisplayString(property.name);
  const safeCity = sanitizeDisplayString(property.location.city);
  const safeState = sanitizeDisplayString(property.location.state);
  const roi = typeof property.metrics.roi === 'number' ? property.metrics.roi : 0;
  const price = typeof property.price.total === 'number' ? property.price.total : 0;

  return `Check out this property: ${safeName} in ${safeCity}, ${safeState}. ${roi}% ROI - ${price} ETH total value.`;
}

export function buildTwitterShareUrl(propertyUrl: string, shareText: string): string {
  const url = new URL('https://twitter.com/intent/tweet');
  url.searchParams.set('text', shareText);
  url.searchParams.set('url', propertyUrl);
  return url.href;
}

export function buildLinkedInShareUrl(propertyUrl: string): string {
  const url = new URL('https://www.linkedin.com/sharing/share-offsite/');
  url.searchParams.set('url', propertyUrl);
  return url.href;
}

export function buildEmailShareUrl(propertyName: string, shareText: string, propertyUrl: string): string {
  const safeName = sanitizeDisplayString(propertyName);
  const subject = `Check out this property: ${safeName}`;
  const body = `I found this interesting property and thought you might like it:\n\n${shareText}\n\nView it here: ${propertyUrl}`;
  const mailto = new URL('mailto:');
  mailto.searchParams.set('subject', subject);
  mailto.searchParams.set('body', body);
  return mailto.href;
}

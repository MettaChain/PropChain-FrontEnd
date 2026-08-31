import { PhishingProtection } from './phishingProtection';

export interface QRCodeValidationResult {
  isValid: boolean;
  sanitizedUrl: string | null;
  error?: QRCodeValidationError;
  warnings: string[];
}

export type QRCodeValidationError =
  | 'empty_url'
  | 'url_too_long'
  | 'unsafe_protocol'
  | 'invalid_url'
  | 'unsupported_protocol'
  | 'phishing_detected';

const ALLOWED_PROTOCOLS = ['http:', 'https:'] as const;
const BLOCKED_PROTOCOL_PREFIXES = ['javascript:', 'data:', 'blob:', 'vbscript:'] as const;
export const MAX_QR_CODE_URL_LENGTH = 2048;

/**
 * Validates URLs before encoding them in QR codes.
 * Blocks unsafe protocols, phishing domains, and malformed input.
 */
export function validateQRCodeUrl(
  url: string,
  allowedHosts?: readonly string[],
): QRCodeValidationResult {
  const warnings: string[] = [];
  const trimmed = url.trim();

  if (!trimmed) {
    return { isValid: false, sanitizedUrl: null, error: 'empty_url', warnings };
  }

  if (trimmed.length > MAX_QR_CODE_URL_LENGTH) {
    return { isValid: false, sanitizedUrl: null, error: 'url_too_long', warnings };
  }

  const lower = trimmed.toLowerCase();
  if (BLOCKED_PROTOCOL_PREFIXES.some((prefix) => lower.startsWith(prefix))) {
    return {
      isValid: false,
      sanitizedUrl: null,
      error: 'unsafe_protocol',
      warnings: ['Blocked unsafe URL protocol'],
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      isValid: false,
      sanitizedUrl: null,
      error: 'invalid_url',
      warnings: ['Invalid URL format'],
    };
  }

  if (!ALLOWED_PROTOCOLS.includes(parsed.protocol as (typeof ALLOWED_PROTOCOLS)[number])) {
    return {
      isValid: false,
      sanitizedUrl: null,
      error: 'unsupported_protocol',
      warnings: [`Protocol ${parsed.protocol} is not allowed`],
    };
  }

  const phishingResult = PhishingProtection.detectPhishing(trimmed);
  if (phishingResult.isPhishing) {
    return {
      isValid: false,
      sanitizedUrl: null,
      error: 'phishing_detected',
      warnings: phishingResult.threats,
    };
  }

  if (phishingResult.warnings.length > 0) {
    warnings.push(...phishingResult.warnings);
  }

  if (allowedHosts && allowedHosts.length > 0) {
    const host = parsed.hostname.toLowerCase();
    const isAllowed = allowedHosts.some(
      (allowedHost) => host === allowedHost || host.endsWith(`.${allowedHost}`),
    );

    if (!isAllowed) {
      warnings.push('URL host is not on the allowed list');
    }
  }

  return {
    isValid: true,
    sanitizedUrl: parsed.href,
    warnings,
  };
}

/**
 * Returns a display-safe version of a URL for UI rendering.
 */
export function getDisplaySafeUrl(url: string, maxLength = 120): string {
  const validation = validateQRCodeUrl(url);
  if (!validation.isValid || !validation.sanitizedUrl) {
    return '';
  }

  if (validation.sanitizedUrl.length <= maxLength) {
    return validation.sanitizedUrl;
  }

  return `${validation.sanitizedUrl.slice(0, maxLength - 3)}...`;
}

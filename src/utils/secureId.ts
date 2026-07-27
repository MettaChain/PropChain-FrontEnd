/**
 * Secure ID Generation Utility
 *
 * Replaces all Math.random-based ID/hash generation with cryptographically
 * secure alternatives. Uses crypto.randomUUID() when available (all modern
 * browsers), falling back to crypto.getRandomValues().
 */

/**
 * Generate a cryptographically secure random ID string.
 * Uses crypto.randomUUID() when available, falls back to getRandomValues.
 *
 * @param prefix - Optional prefix for the ID
 * @param length - Length of the random part when using fallback (default: 16)
 * @returns A secure random ID string
 */
export function generateSecureId(prefix?: string, length = 16): string {
  // Try crypto.randomUUID() first (available in all modern browsers and Node 19+)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    const uuid = crypto.randomUUID();
    return prefix ? `${prefix}_${uuid}` : uuid;
  }

  // Fallback to crypto.getRandomValues()
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    const randomPart = Array.from(bytes, (byte) =>
      byte.toString(36).padStart(2, '0')
    ).join('');
    return prefix ? `${prefix}_${randomPart}` : randomPart;
  }

  // Ultimate fallback (should never be reached in practice, but prevents crash)
  const randomPart = Date.now().toString(36);
  return prefix ? `${prefix}_${randomPart}` : randomPart;
}

/**
 * Generate a timestamped secure ID with optional prefix.
 * Format: `prefix_timestamp_randomPart`
 *
 * @param prefix - Prefix for the ID (e.g., 'error', 'tx', 'session')
 * @returns A timestamped secure ID string
 */
export function generateTimestampedId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const randomPart = generateSecureRandomHex(8);
  return `${prefix}_${timestamp}_${randomPart}`;
}

/**
 * Generate a secure random hex string of specified length.
 *
 * @param length - Number of hex characters (default: 16)
 * @returns A hex string from crypto.getRandomValues()
 */
export function generateSecureRandomHex(length = 16): string {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(Math.ceil(length / 2));
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) =>
      byte.toString(16).padStart(2, '0')
    ).join('').slice(0, length);
  }

  // Fallback
  return Date.now().toString(36);
}

/**
 * Generate a secure session ID.
 * Format: `sess_timestamp_randomPart`
 */
export function generateSessionId(): string {
  return generateTimestampedId('sess');
}

/**
 * Generate a secure correlation ID for logging.
 * Format: `corr_timestamp_randomPart`
 */
export function generateCorrelationId(): string {
  return generateTimestampedId('corr');
}

/**
 * Generate a secure error ID.
 * Format: `error_timestamp_randomPart`
 */
export function generateErrorId(): string {
  return generateTimestampedId('error');
}

/**
 * Generate a secure alert ID.
 * Format: `alert_timestamp_randomPart`
 */
export function generateAlertId(): string {
  return generateTimestampedId('alert');
}

/**
 * Generate a secure transaction hash (for demo/mock purposes).
 * Uses crypto.getRandomValues for unpredictability.
 *
 * @returns A 64-character hex string prefixed with 0x
 */
export function generateMockTxHash(): string {
  const hex = generateSecureRandomHex(64);
  return `0x${hex}`;
}

/**
 * Generate a secure child ID from a parent ID.
 *
 * @param parentId - The parent correlation ID
 * @returns A child correlation ID
 */
export function generateChildId(parentId: string): string {
  const suffix = generateSecureRandomHex(6);
  return `${parentId}-${suffix}`;
}

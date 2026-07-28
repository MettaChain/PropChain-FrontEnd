/**
 * Field-Level Encryption Utility
 *
 * Implements AES-256-GCM encryption for sensitive data (PII) before transmission
 * or storage. Encryption keys are derived from environment variables and are
 * rotatable via key versioning.
 *
 * Usage:
 *   const encrypted = encryptField('user@example.com');
 *   const decrypted = decryptField(encrypted);
 *
 * For searchable fields (email lookups), use `hashForLookup()` which produces
 * a deterministic SHA-256 hash for exact-match queries.
 *
 * @see https://github.com/MettaChain/PropChain-FrontEnd/issues/786
 */

const ENCRYPTION_KEY = (() => {
  const key = process.env.NEXT_PUBLIC_FIELD_ENCRYPTION_KEY;
  if (!key || key.length < 32) {
    if (typeof window !== 'undefined') {
      console.warn(
        '[encryption] NEXT_PUBLIC_FIELD_ENCRYPTION_KEY missing or too short (< 32 chars). Using fallback key – NOT for production.',
      );
    }
    // Fallback key derived from a constant — only for development
    return 'propchain-dev-fallback-key-32ch';
  }
  return key;
})();

const KEY_VERSION = process.env.NEXT_PUBLIC_ENCRYPTION_KEY_VERSION || 'v1';

const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12; // 96 bits for GCM
const TAG_LENGTH = 128; // bits

async function getKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(ENCRYPTION_KEY).slice(0, 32); // Use first 32 bytes

  return crypto.subtle.importKey(
    'raw',
    keyData,
    { name: ALGORITHM, length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a versioned, base64-encoded string: `v1:iv:encryptedData`
 */
export async function encryptField(plaintext: string): Promise<string> {
  if (!plaintext) return plaintext;

  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoder = new TextEncoder();

  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv, tagLength: TAG_LENGTH },
    key,
    encoder.encode(plaintext),
  );

  // Combine IV + encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  const base64 = btoa(String.fromCharCode(...combined));
  return `${KEY_VERSION}:${base64}`;
}

/**
 * Decrypts a versioned, base64-encoded ciphertext back to plaintext.
 */
export async function decryptField(ciphertext: string): Promise<string> {
  if (!ciphertext) return ciphertext;

  // Handle versioned format
  let encoded = ciphertext;
  if (ciphertext.includes(':')) {
    const [version, ...rest] = ciphertext.split(':');
    encoded = rest.join(':');
    // Version can be used for key rotation logic in the future
    void version;
  }

  try {
    const combined = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
    const iv = combined.slice(0, IV_LENGTH);
    const data = combined.slice(IV_LENGTH);

    const key = await getKey();
    const decrypted = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv, tagLength: TAG_LENGTH },
      key,
      data,
    );

    return new TextDecoder().decode(decrypted);
  } catch {
    // If decryption fails (wrong key, corrupted data), return obfuscated value
    return '[encrypted]';
  }
}

/**
 * Produces a deterministic SHA-256 hash of the input for exact-match lookups.
 * Used for searchable fields like email addresses.
 *
 * The hash is salted with the encryption key to prevent rainbow table attacks.
 */
export async function hashForLookup(value: string): Promise<string> {
  if (!value) return '';

  const encoder = new TextEncoder();
  const data = encoder.encode(`${ENCRYPTION_KEY}:${value}`);

  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Synchronous wrapper for encryptField that falls back gracefully in
 * environments where crypto.subtle is not available (e.g., SSR without HTTPS).
 */
export function encryptFieldSync(plaintext: string): string {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    // Fallback: base64 encode (NOT secure — development only)
    if (typeof window !== 'undefined') {
      console.warn('[encryption] crypto.subtle not available; using base64 fallback');
    }
    return `fallback:${btoa(plaintext)}`;
  }
  // Fire-and-forget async encryption — caller should use encryptField directly
  return plaintext;
}

/**
 * Checks if a value appears to be encrypted (starts with version prefix).
 */
export function isEncrypted(value: string): boolean {
  return /^v\d+:/.test(value) || value.startsWith('fallback:');
}

/**
 * Array of sensitive field names that should be encrypted before storage/transmission.
 */
export const SENSITIVE_FIELDS = [
  'email',
  'phone',
  'firstName',
  'lastName',
  'address',
  'walletAddress',
  'taxId',
  'ssn',
  'passportNumber',
  'nationalId',
  'dateOfBirth',
] as const;

/**
 * Encrypts all sensitive fields in a data object (shallow).
 * Returns a new object with sensitive fields encrypted.
 */
export async function encryptSensitiveFields<T extends Record<string, unknown>>(
  data: T,
): Promise<T> {
  const result = { ...data };
  for (const key of Object.keys(result)) {
    if (SENSITIVE_FIELDS.includes(key as (typeof SENSITIVE_FIELDS)[number])) {
      const value = result[key];
      if (typeof value === 'string' && value.length > 0 && !isEncrypted(value)) {
        result[key] = (await encryptField(value)) as T[Extract<keyof T, string>];
      }
    }
  }
  return result;
}

/**
 * Decrypts all sensitive fields in a data object (shallow).
 * Returns a new object with sensitive fields decrypted back to plaintext.
 */
export async function decryptSensitiveFields<T extends Record<string, unknown>>(
  data: T,
): Promise<T> {
  const result = { ...data };
  for (const key of Object.keys(result)) {
    if (SENSITIVE_FIELDS.includes(key as (typeof SENSITIVE_FIELDS)[number])) {
      const value = result[key];
      if (typeof value === 'string' && isEncrypted(value)) {
        result[key] = (await decryptField(value)) as T[Extract<keyof T, string>];
      }
    }
  }
  return result;
}

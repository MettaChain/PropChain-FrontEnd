const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const PERIOD_SECONDS = 30;
const DIGITS = 6;

function toBase32(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  while (output.length % 8 !== 0) {
    output += '=';
  }

  return output;
}

function fromBase32(input: string): Uint8Array {
  const normalized = input.replace(/=+$/g, '').replace(/\s+/g, '').toUpperCase();
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (const char of normalized) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) continue;

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return new Uint8Array(output);
}

function numberToBytes(counter: number): Uint8Array {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setUint32(4, counter, false);
  return new Uint8Array(buffer);
}

async function hmacSha1(keyBytes: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, message);
  return new Uint8Array(signature);
}

export function generateTotpSecret(length = 20): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return toBase32(bytes).replace(/=/g, '');
}

export function buildOtpAuthUri(params: {
  secret: string;
  issuer: string;
  accountName: string;
}): string {
  const label = encodeURIComponent(`${params.issuer}:${params.accountName}`);
  const issuer = encodeURIComponent(params.issuer);

  return `otpauth://totp/${label}?secret=${params.secret}&issuer=${issuer}&algorithm=SHA1&digits=${DIGITS}&period=${PERIOD_SECONDS}`;
}

export function normalizeTotpCode(code: string): string {
  return code.replace(/\D/g, '').slice(0, DIGITS);
}

export async function generateTotpCode(
  secret: string,
  timestamp = Date.now()
): Promise<string> {
  const counter = Math.floor(timestamp / 1000 / PERIOD_SECONDS);
  const secretBytes = fromBase32(secret);
  const counterBytes = numberToBytes(counter);
  const hash = await hmacSha1(secretBytes, counterBytes);
  const offset = hash[hash.length - 1] & 0x0f;
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);
  const code = (binary % 10 ** DIGITS).toString().padStart(DIGITS, '0');
  return code;
}

export async function verifyTotpCode(params: {
  secret: string;
  code: string;
  timestamp?: number;
  window?: number;
}): Promise<boolean> {
  const normalizedCode = normalizeTotpCode(params.code);
  if (normalizedCode.length !== DIGITS) return false;

  const timestamp = params.timestamp ?? Date.now();
  const window = params.window ?? 1;

  for (let offset = -window; offset <= window; offset += 1) {
    const candidate = await generateTotpCode(
      params.secret,
      timestamp + offset * PERIOD_SECONDS * 1000
    );

    if (candidate === normalizedCode) {
      return true;
    }
  }

  return false;
}

export function getTotpWindowSeconds(timestamp = Date.now()): number {
  return PERIOD_SECONDS - Math.floor((timestamp / 1000) % PERIOD_SECONDS);
}

export function formatTrustedDeviceExpiry(until: number): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(until));
}


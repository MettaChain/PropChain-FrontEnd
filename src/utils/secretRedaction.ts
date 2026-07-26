export const SECRETS_DENY_LIST = new Set([
  'password', 'passwd', 'pwd', 'secret', 'apikey', 'api_key',
  'accesstoken', 'access_token', 'refreshtoken', 'refresh_token',
  'privatekey', 'private_key', 'mnemonic', 'seedphrase', 'seed_phrase', 'seed',
  'token', 'authorization', 'auth', 'sessionid', 'session_id',
  'cookie', 'ssn', 'creditcard', 'credit_card', 'cvv',
]);

export const SENSITIVE_PATTERNS: RegExp[] = [
  /0x[a-fA-F0-9]{64}/g, // ETH private keys
  /"(?:password|token|secret|authorization)"\s*:\s*"[^"]+"/gi,
];

export const redactValue = (value: unknown, seen = new WeakSet()): unknown => {
  if (value === null || value === undefined) return value;

  if (typeof value === 'string') {
    let v = value.replace(/0x[a-fA-F0-9]{64}/g, '0x[REDACTED_PRIVATE_KEY]');
    for (const p of SENSITIVE_PATTERNS) {
      v = v.replace(p, '[REDACTED]');
    }
    return v;
  }

  if (typeof value === 'object') {
    if (seen.has(value as object)) {
      return '[CIRCULAR]';
    }
    seen.add(value as object);

    if (Array.isArray(value)) {
      return value.map(item => redactValue(item, seen));
    }

    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SECRETS_DENY_LIST.has(k.toLowerCase())) {
        out[k] = '[REDACTED]';
      } else {
        out[k] = redactValue(v, seen);
      }
    }
    return out;
  }

  return value;
};

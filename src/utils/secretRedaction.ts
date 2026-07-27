export const SECRETS_DENY_LIST = new Set([
  'password', 'passwd', 'pwd', 'secret', 'apikey', 'api_key',
  'accesstoken', 'access_token', 'refreshtoken', 'refresh_token',
  'privatekey', 'private_key', 'mnemonic', 'seedphrase', 'seed_phrase', 'seed',
  'token', 'authorization', 'auth', 'sessionid', 'session_id',
  'cookie', 'ssn', 'creditcard', 'credit_card', 'cvv',
]);

const SENSITIVE_PATTERNS: RegExp[] = [
  /0x[a-fA-F0-9]{64}/g, // ETH private keys
];

export function redactSecrets(value: any, seen = new WeakSet()): any {
  if (value === null || value === undefined) return value;

  if (typeof value === 'string') {
    let v = value;
    v = v.replace(/0x[a-fA-F0-9]{64}/g, '0x[REDACTED_PRIVATE_KEY]');
    return v;
  }

  if (typeof value !== 'object') {
    return value;
  }

  if (seen.has(value)) {
    return '[Circular]';
  }
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map(item => redactSecrets(item, seen));
  }

  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(value)) {
    if (SECRETS_DENY_LIST.has(key.toLowerCase())) {
      result[key] = '[REDACTED]';
    } else {
      result[key] = redactSecrets(val, seen);
    }
  }

  return result;
}

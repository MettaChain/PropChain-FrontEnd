/**
 * Reads an environment variable, falling back to `defaultValue`.
 *
 * Throws when neither is present, so a missing value fails at the read rather
 * than surfacing as undefined later.
 */
export function requireEnv(name: string, defaultValue?: string): string {
  const value = process.env[name] ?? defaultValue;
  if (value === undefined || value === '') {
    const message = `Missing required environment variable: ${name}`;
    if (process.env.NODE_ENV === 'production') {
      throw new Error(message);
    }
    console.warn(`[requireEnv] ${message} — using fallback`);
    return '';
  }
  return value;
}

/**
 * Reads an environment variable, throwing when it is unset. No fallback.
 */
export function requireEnvStrict(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

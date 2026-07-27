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

export function requireEnvStrict(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

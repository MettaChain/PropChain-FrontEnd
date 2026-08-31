/**
 * Tests for src/config/env/schema.ts
 * Covers validateEnv and validateEnvRequirements boot-time env validation.
 * Issue #935
 */

import { validateEnv, validateEnvRequirements, envSchema } from '../schema';

describe('envSchema', () => {
  it('applies defaults for optional fields', () => {
    const result = envSchema.safeParse({});
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.NEXT_PUBLIC_APP_NAME).toBe('PropChain');
    expect(result.data.NODE_ENV).toBe('development');
    expect(result.data.CSP_ENFORCE).toBe(false);
    expect(result.data.NEXT_PUBLIC_DEFAULT_LOCALE).toBe('en');
    expect(result.data.NEXT_PUBLIC_SUPPORTED_LOCALES).toBe('en,es,fr,de,zh,ar,he');
  });

  it('transforms string booleans correctly', () => {
    const result = envSchema.safeParse({
      CSP_ENFORCE: 'true',
      NEXT_PUBLIC_ANALYTICS_ENABLED: 'true',
      NEXT_PUBLIC_DEBUG_MODE: 'true',
    });
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.CSP_ENFORCE).toBe(true);
    expect(result.data.NEXT_PUBLIC_ANALYTICS_ENABLED).toBe(true);
    expect(result.data.NEXT_PUBLIC_DEBUG_MODE).toBe(true);
  });

  it('defaults string booleans to false when unset', () => {
    const result = envSchema.safeParse({});
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.NEXT_PUBLIC_ANALYTICS_ENABLED).toBe(false);
    expect(result.data.NEXT_PUBLIC_ERROR_REPORTING_ENABLED).toBe(true);
    expect(result.data.NEXT_PUBLIC_DEBUG_MODE).toBe(false);
    expect(result.data.NEXT_PUBLIC_MAINTENANCE_MODE).toBe(false);
    expect(result.data.NEXT_PUBLIC_USE_MOCK_DATA).toBe(false);
    expect(result.data.NEXT_PUBLIC_SKIP_AUTH).toBe(false);
  });

  it('parses rate limit numeric strings', () => {
    const result = envSchema.safeParse({
      RATE_LIMIT_WINDOW_MS: '60000',
      RATE_LIMIT_MAX_REQUESTS: '200',
      RATE_LIMIT_MAX_REQUESTS_PER_WALLET: '10',
    });
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.RATE_LIMIT_WINDOW_MS).toBe(60000);
    expect(result.data.RATE_LIMIT_MAX_REQUESTS).toBe(200);
    expect(result.data.RATE_LIMIT_MAX_REQUESTS_PER_WALLET).toBe(10);
  });
});

describe('validateEnv', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns validated config when env has valid values', () => {
    process.env.NEXT_PUBLIC_APP_NAME = 'TestApp';
    process.env.NODE_ENV = 'development';

    const config = validateEnv();
    expect(config.NEXT_PUBLIC_APP_NAME).toBe('TestApp');
    expect(config.NODE_ENV).toBe('development');
  });

  it('throws when NODE_ENV is not a valid enum value', () => {
    process.env.NODE_ENV = 'invalid-env';

    expect(() => validateEnv()).toThrow('Environment validation failed');
  });
});

describe('validateEnvRequirements', () => {
  it('does not throw for development without RPC URLs', () => {
    const config = {
      NODE_ENV: 'development' as const,
      ETHEREUM_MAINNET_RPC_URL: undefined,
      NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: undefined,
    } as ReturnType<typeof validateEnv>;

    expect(() => validateEnvRequirements(config)).not.toThrow();
  });

  it('throws for staging when required RPC URL is missing', () => {
    const config = {
      NODE_ENV: 'staging' as const,
      ETHEREUM_MAINNET_RPC_URL: undefined,
      NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: undefined,
    } as ReturnType<typeof validateEnv>;

    expect(() => validateEnvRequirements(config)).toThrow(
      /Environment-specific requirements for 'staging' are not met/,
    );
  });

  it('does not throw for staging with all required fields', () => {
    const config = {
      NODE_ENV: 'staging' as const,
      ETHEREUM_MAINNET_RPC_URL: 'https://eth.example.com',
      NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: 'test-project-id',
    } as ReturnType<typeof validateEnv>;

    expect(() => validateEnvRequirements(config)).not.toThrow();
  });

  it('warns (does not throw) for production with missing optional fields', () => {
    const config = {
      NODE_ENV: 'production' as const,
      ETHEREUM_MAINNET_RPC_URL: undefined,
      POLYGON_MAINNET_RPC_URL: undefined,
      BSC_MAINNET_RPC_URL: undefined,
      NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: undefined,
    } as ReturnType<typeof validateEnv>;

    expect(() => validateEnvRequirements(config)).not.toThrow();
  });
});

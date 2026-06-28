import { requireEnv, requireEnvStrict } from '../requireEnv';

const OLD_ENV = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = { ...OLD_ENV };
});

afterAll(() => {
  process.env = OLD_ENV;
});

describe('requireEnv', () => {
  it('returns the env value when present', () => {
    process.env.MY_VAR = 'hello';
    expect(requireEnv('MY_VAR')).toBe('hello');
  });

  it('returns the default when env is missing', () => {
    delete process.env.MY_VAR;
    expect(requireEnv('MY_VAR', 'fallback')).toBe('fallback');
  });

  it('returns empty string and warns when env is missing in development', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.MY_VAR;
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const result = requireEnv('MY_VAR');
    expect(result).toBe('');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Missing required environment variable: MY_VAR')
    );
    warnSpy.mockRestore();
  });

  it('returns empty string when env is empty string', () => {
    process.env.MY_VAR = '';
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    expect(requireEnv('MY_VAR')).toBe('');
    warnSpy.mockRestore();
  });
});

describe('requireEnvStrict', () => {
  it('returns the env value when present', () => {
    process.env.STRICT_VAR = 'secret';
    expect(requireEnvStrict('STRICT_VAR')).toBe('secret');
  });

  it('throws when env is missing', () => {
    delete process.env.STRICT_VAR;
    expect(() => requireEnvStrict('STRICT_VAR')).toThrow(
      'Missing required environment variable: STRICT_VAR'
    );
  });

  it('throws when env is empty', () => {
    process.env.STRICT_VAR = '';
    expect(() => requireEnvStrict('STRICT_VAR')).toThrow(
      'Missing required environment variable: STRICT_VAR'
    );
  });
});

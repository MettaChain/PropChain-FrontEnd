import { PhishingProtection } from '../phishingProtection';

jest.mock('@/utils/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('PhishingProtection.reportSuspiciousDomain', () => {
  it('uses structured logger and does not call console directly', async () => {
    const { logger } = jest.requireMock('@/utils/logger') as {
      logger: { warn: jest.Mock; error: jest.Mock };
    };

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const result = await PhishingProtection.reportSuspiciousDomain('evil.example', 'Unofficial domain');

    expect(result).toBe(true);
    expect(logger.warn).toHaveBeenCalledWith('[Security] Reporting suspicious domain', {
      domain: 'evil.example',
      reason: 'Unofficial domain',
    });
    expect(logger.error).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();

    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });
});


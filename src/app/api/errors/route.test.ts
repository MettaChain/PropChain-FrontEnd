import { NextRequest } from 'next/server';
import type { ErrorReportingData } from '@/types/errors';

jest.mock('next/server', () => {
  const NextRequest = class {
    constructor(input, init = {}) {
      this.url = typeof input === 'string' ? input : input.url;
      this.method = init.method || 'GET';
      this.body = init.body || null;
      this.headers = new Headers(init.headers);
    }
    async json() {
      return JSON.parse(this.body || '{}');
    }
  };
  const NextResponse = {
    json(body, init = {}) {
      return {
        status: init.status ?? 200,
        headers: new Headers(init.headers),
        async json() {
          return body;
        },
      };
    },
  };
  return { NextRequest, NextResponse };
});

jest.mock('@/lib/rateLimit', () => ({
  withRateLimit: <T,>(handler: T): T => handler,
}));

jest.mock('@/lib/csrf', () => ({
  withCsrf: <T,>(handler: T): T => handler,
}));

jest.mock('@/utils/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

const fetchMock = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>();
const endpoint = 'https://errors.example.com/reports';

const validReport: ErrorReportingData = {
  errorId: 'error-123',
  category: 'ui',
  severity: 'medium',
  message: 'A component failed to render',
  userAgent: 'Jest',
  url: 'https://propchain.example.com/dashboard',
  timestamp: '2026-08-26T00:00:00.000Z',
  sessionId: 'session-123',
};

function createRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/errors', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function post(body: unknown) {
  const { POST } = await import('./route');
  return POST(createRequest(body));
}

describe('POST /api/errors', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.ERROR_REPORTING_ENDPOINT = endpoint;
    delete process.env.ERROR_REPORTING_API_KEY;
    fetchMock.mockReset();
    globalThis.fetch = fetchMock;
  });

  afterEach(() => {
    delete process.env.ERROR_REPORTING_ENDPOINT;
    delete process.env.ERROR_REPORTING_API_KEY;
  });

  it('forwards a valid report to the configured destination', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 202 } as Response);

    const response = await post(validReport);

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      endpoint,
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validReport),
      }),
    );
  });

  it('rejects reports missing required fields', async () => {
    const response = await post({ errorId: validReport.errorId });

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns a service-unavailable response when forwarding fails', async () => {
    fetchMock.mockRejectedValue(new Error('destination unavailable'));

    const response = await post(validReport);

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: 'Unable to persist error report',
    });
  });
});

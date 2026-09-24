import crypto from 'crypto';

jest.mock('next/server', () => {
  const NextRequest = class {
    private bodyText: string;
    headers: Headers;

    constructor(bodyText: string, headers: Record<string, string> = {}) {
      this.bodyText = bodyText;
      this.headers = new Headers(headers);
    }

    async text() {
      return this.bodyText;
    }
  };
  const NextResponse = {
    json(body: unknown, init: { status?: number } = {}) {
      return {
        status: init.status ?? 200,
        async json() {
          return body;
        },
      };
    },
  };
  return { NextRequest, NextResponse };
});

jest.mock('@/lib/propertyServiceServer', () => ({
  revalidateProperty: jest.fn().mockResolvedValue({ success: true, message: 'ok' }),
  revalidateAllProperties: jest.fn().mockResolvedValue({ success: true, message: 'ok' }),
}));

jest.mock('@/utils/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const WEBHOOK_SECRET = 'test-webhook-secret';

function createRequest(bodyText: string, signature?: string) {
  const headers: Record<string, string> = {};
  if (signature !== undefined) {
    headers['x-webhook-signature'] = signature;
  }
  const { NextRequest } = jest.requireMock('next/server') as {
    NextRequest: new (body: string, headers: Record<string, string>) => unknown;
  };
  return new NextRequest(bodyText, headers) as never;
}

function sign(body: string) {
  return crypto.createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex');
}

describe('POST /api/revalidate (#1014)', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.REVALIDATE_WEBHOOK_SECRET = WEBHOOK_SECRET;
  });

  it('returns 401 (not 500) for a short/malformed signature', async () => {
    const { POST } = await import('./route');
    const body = JSON.stringify({ type: 'all-properties' });

    const response = await POST(createRequest(body, 'short'));

    expect(response.status).toBe(401);
  });

  it('returns 401 for a well-formed but incorrect signature', async () => {
    const { POST } = await import('./route');
    const body = JSON.stringify({ type: 'all-properties' });
    const wrongSignature = sign('a different body');

    const response = await POST(createRequest(body, wrongSignature));

    expect(response.status).toBe(401);
  });

  it('revalidates successfully for a valid signature', async () => {
    const { POST } = await import('./route');
    const body = JSON.stringify({ type: 'all-properties' });

    const response = await POST(createRequest(body, sign(body)));

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
  });
});

import { NextRequest } from 'next/server';

jest.mock('next/server', () => {
  const NextRequest = class {
    constructor(input, init = {}) {
      this.url = typeof input === 'string' ? input : input.url;
      this.method = init.method || 'GET';
      this.headers = new Headers(init.headers);
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

// Rate limiting itself is covered by src/lib/__tests__/rateLimit.test.ts;
// here we only need to confirm the route is wrapped with it.
jest.mock('@/lib/rateLimit', () => ({
  withRateLimit: <T,>(handler: T): T => handler,
}));

const fetchMock = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>();

function createRequest(url: string, headers: Record<string, string> = {}) {
  return new NextRequest(url, { headers });
}

async function get(url: string, headers?: Record<string, string>) {
  const { GET } = await import('./route');
  return GET(createRequest(url, headers));
}

const AUTH_HEADERS = { 'x-wallet-address': '0xabc0000000000000000000000000000000abcd' };
const VALID_ADDRESS = '0x1234567890123456789012345678901234567890';

describe('GET /api/security/address-check', () => {
  beforeEach(() => {
    jest.resetModules();
    fetchMock.mockReset();
    globalThis.fetch = fetchMock;
    delete process.env.CHAINALYSIS_API_KEY;
  });

  it('rejects requests with no wallet-identified caller', async () => {
    const response = await get(
      `http://localhost/api/security/address-check?address=${VALID_ADDRESS}`,
    );

    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects an invalid address for an authenticated caller', async () => {
    const response = await get(
      'http://localhost/api/security/address-check?address=not-an-address',
      AUTH_HEADERS,
    );

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns a fallback response when no upstream key is configured', async () => {
    const response = await get(
      `http://localhost/api/security/address-check?address=${VALID_ADDRESS}`,
      AUTH_HEADERS,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      address: VALID_ADDRESS,
      risk_score: 50,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('forwards to the upstream service for a valid authenticated request', async () => {
    process.env.CHAINALYSIS_API_KEY = 'test-key';
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ address: VALID_ADDRESS, risk_score: 5 }),
    } as Response);

    const response = await get(
      `http://localhost/api/security/address-check?address=${VALID_ADDRESS}`,
      AUTH_HEADERS,
    );

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      `https://api.chainalysis.com/api/v2/address/${VALID_ADDRESS}`,
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-key' }),
      }),
    );
  });
});

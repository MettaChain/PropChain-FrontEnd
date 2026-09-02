import { GET } from '../route';

jest.mock('@/lib/csrf', () => ({
  getCsrfSessionId: jest.fn(),
  getAuthStatePart: jest.fn(),
  generateTokenForSession: jest.fn(),
}));

jest.mock('next/server', () => {
  const BaseResponse = class {
    constructor(body, init = {}) {
      this._body = body;
      this.status = init.status ?? 200;
      this.headers = new Headers();
      this.cookies = {
        set: (name, value, opts = {}) => {
          const parts = [`${name}=${value}`];
          if (opts.httpOnly) parts.push('HttpOnly');
          if (opts.sameSite) parts.push(`SameSite=${opts.sameSite[0].toUpperCase()}${opts.sameSite.slice(1)}`);
          if (opts.path) parts.push(`Path=${opts.path}`);
          if (opts.secure) parts.push('Secure');
          this.headers.set('set-cookie', parts.join('; '));
        },
        get: jest.fn(),
      };
    }
    async json() {
      return JSON.parse(this._body);
    }
  };
  return {
    NextRequest: class {
      constructor(input) {
        this.url = typeof input === 'string' ? input : input.url;
      }
    },
    NextResponse: {
      json(body, init) {
        return new BaseResponse(JSON.stringify(body), init);
      },
    },
  };
});

import { getCsrfSessionId, getAuthStatePart, generateTokenForSession } from '@/lib/csrf';

function makeRequest(cookieValues: Record<string, string> = {}) {
  const cookieStore = new Map(Object.entries(cookieValues));
  return {
    cookies: {
      get: (name: string) => (cookieStore.has(name) ? { value: cookieStore.get(name) } : undefined),
    },
  } as any;
}

describe('CSRF route handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getCsrfSessionId as jest.Mock).mockReturnValue({ sessionId: 'existing-session', isNew: false });
    (getAuthStatePart as jest.Mock).mockReturnValue('auth-state');
    (generateTokenForSession as jest.Mock).mockReturnValue('generated-token-123');
  });

  it('returns 200 with token', async () => {
    const request = makeRequest();
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ csrfToken: 'generated-token-123' });
    expect(generateTokenForSession).toHaveBeenCalledWith('existing-session', 'auth-state');
  });

  it('sets cookie for new session', async () => {
    (getCsrfSessionId as jest.Mock).mockReturnValue({ sessionId: 'new-uuid-session', isNew: true });

    const request = makeRequest();
    const response = await GET(request);

    const setCookieHeader = response.headers.get('set-cookie');
    expect(setCookieHeader).toContain('csrf-session=new-uuid-session');
    expect(setCookieHeader).toContain('HttpOnly');
    expect(setCookieHeader).toContain('SameSite=Lax');
  });

  it('does not set cookie for existing session', async () => {
    (getCsrfSessionId as jest.Mock).mockReturnValue({ sessionId: 'existing-session', isNew: false });

    const request = makeRequest({ 'csrf-session': 'existing-session' });
    const response = await GET(request);

    const setCookieHeader = response.headers.get('set-cookie');
    expect(setCookieHeader).toBeNull();
  });

  it('returns existing token for valid session', async () => {
    (getCsrfSessionId as jest.Mock).mockReturnValue({ sessionId: 'valid-session', isNew: false });
    (generateTokenForSession as jest.Mock).mockReturnValue('session-specific-token');

    const request = makeRequest({ 'csrf-session': 'valid-session' });
    const response = await GET(request);
    const body = await response.json();

    expect(body.csrfToken).toBe('session-specific-token');
    expect(getCsrfSessionId).toHaveBeenCalledWith(request);
    expect(getAuthStatePart).toHaveBeenCalledWith(request);
  });
});

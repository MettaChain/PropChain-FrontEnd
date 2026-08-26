import { GET } from '../route';

jest.mock('@/lib/csrf', () => ({
  getCsrfSessionId: jest.fn(),
  getAuthStatePart: jest.fn(),
  generateTokenForSession: jest.fn(),
}));

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

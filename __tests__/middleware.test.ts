import { NextRequest } from 'next/server';
import { middleware } from '../middleware';
import { SignJWT } from 'jose';

// Mock NextResponse
jest.mock('next/server', () => {
  const originalModule = jest.requireActual('next/server');
  return {
    ...originalModule,
    NextResponse: {
      next: jest.fn(() => ({ type: 'next' })),
      redirect: jest.fn((url) => ({
        type: 'redirect',
        url,
        cookies: {
          delete: jest.fn()
        }
      })),
    },
  };
});

describe('middleware', () => {
  const secretKey = 'test-secret';
  let originalEnv: NodeJS.ProcessEnv;

  beforeAll(() => {
    originalEnv = process.env;
    process.env = { ...originalEnv, AUTH_SECRET: secretKey };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  const createRequest = (pathname: string, tokenValue?: string) => {
    const req = new NextRequest(`http://localhost${pathname}`);
    if (tokenValue !== undefined) {
      req.cookies.set('auth-token', tokenValue);
    }
    return req;
  };

  const createToken = async (expOffset: number, payload = {}) => {
    const secret = new TextEncoder().encode(secretKey);
    return new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(Math.floor(Date.now() / 1000) + expOffset)
      .sign(secret);
  };

  it('allows public routes without token', async () => {
    const req = createRequest('/public');
    const res = await middleware(req);
    expect((res as any).type).toBe('next');
  });

  it('redirects protected routes without token', async () => {
    const req = createRequest('/dashboard');
    const res = await middleware(req);
    expect((res as any).type).toBe('redirect');
    expect((res as any).url.pathname).toBe('/');
  });

  it('allows protected routes with valid token', async () => {
    const token = await createToken(3600); // Expires in 1 hour
    const req = createRequest('/dashboard', token);
    const res = await middleware(req);
    expect((res as any).type).toBe('next');
  });

  it('redirects protected routes with expired token', async () => {
    const token = await createToken(-3600); // Expired 1 hour ago
    const req = createRequest('/dashboard', token);
    const res = await middleware(req);
    expect((res as any).type).toBe('redirect');
  });

  it('redirects protected routes with tampered token', async () => {
    const token = await createToken(3600);
    const req = createRequest('/dashboard', token + 'tampered');
    const res = await middleware(req);
    expect((res as any).type).toBe('redirect');
  });
});

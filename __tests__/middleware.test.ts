import { NextRequest } from 'next/server';
import { middleware } from '../middleware';
import { SignJWT } from 'jose';

describe('middleware', () => {
  const secret = new TextEncoder().encode('test_secret');
  
  beforeAll(() => {
    process.env.AUTH_SECRET = 'test_secret';
  });

  afterAll(() => {
    delete process.env.AUTH_SECRET;
  });

  const createRequest = (path: string, token?: string) => {
    const req = new NextRequest(new URL(`http://localhost${path}`));
    if (token) {
      req.cookies.set('auth-token', token);
    }
    return req;
  };

  it('should allow access to unprotected routes without token', async () => {
    const req = createRequest('/');
    const res = await middleware(req);
    expect(res.headers.get('x-middleware-next')).toBe('1');
  });

  it('should redirect to home if no token on protected route', async () => {
    const req = createRequest('/dashboard');
    const res = await middleware(req);
    expect(res.status).toBe(307); // Redirect status
    expect(res.headers.get('location')).toContain('/?callbackUrl=%2Fdashboard');
  });

  it('should allow access if valid token is provided on protected route', async () => {
    const validToken = await new SignJWT({ user: '123' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secret);
      
    const req = createRequest('/dashboard', validToken);
    const res = await middleware(req);
    expect(res.headers.get('x-middleware-next')).toBe('1');
  });

  it('should redirect if token is expired on protected route', async () => {
    const expiredToken = await new SignJWT({ user: '123' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('-1h') // Expired 1 hour ago
      .sign(secret);
      
    const req = createRequest('/dashboard', expiredToken);
    const res = await middleware(req);
    expect(res.status).toBe(307); // Redirect status
    expect(res.headers.get('location')).toContain('/?callbackUrl=%2Fdashboard');
  });

  it('should redirect if token is tampered with', async () => {
    const req = createRequest('/dashboard', 'invalid-tampered-token');
    const res = await middleware(req);
    expect(res.status).toBe(307); // Redirect status
    expect(res.headers.get('location')).toContain('/?callbackUrl=%2Fdashboard');
  });
});

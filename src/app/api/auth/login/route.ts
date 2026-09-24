import { NextRequest, NextResponse } from 'next/server';
import { verifyMessage } from 'viem';
import { SignJWT } from 'jose';

const SESSION_TTL_SECONDS = 60 * 60 * 24; // 24h

// Minimal wallet-signature login: verifies the connected wallet signed the
// expected message, then issues the `auth-token` cookie middleware.ts checks.
export async function POST(request: NextRequest) {
  const { address, signature } = await request.json();

  if (!address || !signature) {
    return NextResponse.json({ error: 'address and signature are required' }, { status: 400 });
  }

  const message = `Sign in to PropChain as ${address}`;
  const isValid = await verifyMessage({ address, message, signature }).catch(() => false);

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const secretKey = process.env.AUTH_SECRET?.trim();
  if (!secretKey) {
    return NextResponse.json({ error: 'AUTH_SECRET is not configured' }, { status: 500 });
  }

  const token = await new SignJWT({ address })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(new TextEncoder().encode(secretKey));

  const response = NextResponse.json({ address }, { status: 200 });
  response.cookies.set('auth-token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_TTL_SECONDS,
    path: '/',
  });

  return response;
}

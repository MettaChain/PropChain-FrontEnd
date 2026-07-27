import { NextRequest, NextResponse } from 'next/server';
import { getCsrfSessionId, getAuthStatePart, generateTokenForSession } from '@/lib/csrf';

export async function GET(request: NextRequest) {
  const { sessionId, isNew } = getCsrfSessionId(request);
  const authState = getAuthStatePart(request);
  const token = generateTokenForSession(sessionId, authState);

  const response = NextResponse.json({ csrfToken: token });

  if (isNew) {
    response.cookies.set('csrf-session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }

  return response;
}

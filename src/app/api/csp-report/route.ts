/**
 * CSP Violation Reporting API Route
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { logger } from '@/utils/logger';
import { withRateLimit } from '@/lib/rateLimit';

async function handleCspReportPost(request: NextRequest) {
  try {
    const bodyText = await request.text();

    if (!bodyText) {
      return NextResponse.json(
        { error: 'Empty report body' },
        { status: 400 }
      );
    }

    let report: unknown;

    try {
      report = JSON.parse(bodyText);
    } catch {
      report = { raw: bodyText };
    }

    logger.warn('CSP violation report received', {
      report,
      userAgent: request.headers.get('user-agent'),
      referrer: request.headers.get('referer'),
      url: request.nextUrl.toString(),
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('Failed to process CSP report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(handleCspReportPost);

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}

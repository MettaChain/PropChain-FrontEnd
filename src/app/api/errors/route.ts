import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { ErrorReportingData } from '@/types/errors';
import { logger } from '@/utils/logger';
import { withRateLimit } from '@/lib/rateLimit';
import { withCsrf } from '@/lib/csrf';

const ERROR_REPORTING_TIMEOUT_MS = 5_000;

function isValidErrorReport(body: unknown): body is ErrorReportingData {
  if (typeof body !== 'object' || body === null) {
    return false;
  }

  const report = body as Partial<ErrorReportingData>;
  return [report.errorId, report.category, report.message].every(
    (value) => typeof value === 'string' && value.trim().length > 0,
  );
}

async function forwardErrorReport(report: ErrorReportingData): Promise<void> {
  const endpoint = process.env.ERROR_REPORTING_ENDPOINT;
  if (!endpoint) {
    throw new Error('ERROR_REPORTING_ENDPOINT is not configured');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const apiKey = process.env.ERROR_REPORTING_API_KEY;
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ERROR_REPORTING_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(report),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Error reporting destination returned HTTP ${response.status}`);
    }
  } finally {
    clearTimeout(timeout);
  }
}

async function handleErrorsPost(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    if (!isValidErrorReport(body)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    logger.error('Error Report:', {
      id: body.errorId,
      category: body.category,
      severity: body.severity,
      message: body.message,
      userAgent: body.userAgent,
      url: body.url,
      timestamp: body.timestamp,
      context: body.context,
    });

    try {
      await forwardErrorReport(body);
    } catch (error) {
      logger.error('Error report forwarding failed:', error);
      return NextResponse.json(
        { error: 'Unable to persist error report' },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { success: true, message: 'Error reported successfully' },
      { status: 200 },
    );
  } catch (error) {
    logger.error('Error reporting failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// Export the rate-limited POST handler
export const POST = withRateLimit(withCsrf(handleErrorsPost));

async function handleErrorsGet() {
  return NextResponse.json(
    { message: 'Error reporting endpoint. Use POST to report errors.' },
    { status: 200 },
  );
}

// Export the rate-limited GET handler
export const GET = withRateLimit(handleErrorsGet);

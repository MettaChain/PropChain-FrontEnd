import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { ErrorReportingData } from '@/types/errors';
import { logger } from '@/utils/logger';
import { withRateLimit } from '@/lib/rateLimit';

async function handleErrorsPost(request: NextRequest) {
  try {
    const body: ErrorReportingData = await request.json();
    
    // Validate required fields
    if (!body.errorId || !body.category || !body.message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Log error (in production, this would go to your analytics service)
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

    // Store in database (placeholder for actual implementation)
    // await db.errors.create({ ...body });

    // Send to external service (placeholder for actual implementation)
    // await analyticsService.trackError(body);

    return NextResponse.json(
      { success: true, message: 'Error reported successfully' },
      { status: 200 }
    );

  } catch (error) {
    logger.error('Error reporting failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Export the rate-limited POST handler
export const POST = withRateLimit(handleErrorsPost);

async function handleErrorsGet() {
  return NextResponse.json(
    { message: 'Error reporting endpoint. Use POST to report errors.' },
    { status: 200 }
  );
}

// Export the rate-limited GET handler
export const GET = withRateLimit(handleErrorsGet);

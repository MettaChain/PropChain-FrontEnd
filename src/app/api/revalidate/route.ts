import { NextRequest, NextResponse } from 'next/server';
import { revalidateProperty, revalidateAllProperties } from '@/lib/propertyServiceServer';
import crypto from 'crypto';

// Webhook secret for security - should be stored in environment variables
const WEBHOOK_SECRET = process.env.REVALIDATE_WEBHOOK_SECRET || 'your-webhook-secret';

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature for security
    const signature = request.headers.get('x-webhook-signature');
    const body = await request.text();
    
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing webhook signature' },
        { status: 401 }
      );
    }

    // Verify signature (HMAC-SHA256)
    const expectedSignature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    const payload = JSON.parse(body);
    const { type, propertyId, reason } = payload;

    let result;

    switch (type) {
      case 'property':
        if (!propertyId) {
          return NextResponse.json(
            { error: 'Property ID is required for property revalidation' },
            { status: 400 }
          );
        }
        result = await revalidateProperty(propertyId);
        break;

      case 'all-properties':
        result = await revalidateAllProperties();
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid revalidation type' },
          { status: 400 }
        );
    }

    // Log revalidation for monitoring
    console.log(`ISR Revalidation: ${type}${propertyId ? ` for property ${propertyId}` : ''} - Reason: ${reason || 'Manual trigger'}`);

    return NextResponse.json({
      success: true,
      message: result.message,
      timestamp: new Date().toISOString(),
      type,
      propertyId: propertyId || null,
    });

  } catch (error) {
    console.error('Webhook revalidation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    endpoint: '/api/revalidate',
    timestamp: new Date().toISOString(),
  });
}

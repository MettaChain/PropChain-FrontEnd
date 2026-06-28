import { NextRequest, NextResponse } from 'next/server';

const CHAINALYSIS_API_KEY = process.env.CHAINALYSIS_API_KEY || '';
const CHAINALYSIS_API_URL = process.env.CHAINALYSIS_API_URL || 'https://api.chainalysis.com/api/v2';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address')?.trim();

  if (!address) {
    return NextResponse.json({ error: 'Address parameter required' }, { status: 400 });
  }

  if (address.length < 10) {
    return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
  }

  if (!CHAINALYSIS_API_KEY) {
    return NextResponse.json({
      risk_score: 50,
      risk_level: 'medium',
      categories: ['unavailable'],
      description: 'Chainalysis API key not configured on server',
    });
  }

  try {
    const response = await fetch(`${CHAINALYSIS_API_URL}/address/${address}`, {
      headers: {
        Authorization: `Bearer ${CHAINALYSIS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`Chainalysis API returned ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check address risk', risk_score: 50, risk_level: 'medium' },
      { status: 502 }
    );
  }
}

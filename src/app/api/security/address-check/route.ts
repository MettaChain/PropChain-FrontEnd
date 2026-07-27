import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address')?.trim();

  if (!address) {
    return NextResponse.json({ error: 'Address parameter required' }, { status: 400 });
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json({ error: 'Invalid Ethereum address' }, { status: 400 });
  }

  const apiKey = process.env.CHAINALYSIS_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      address,
      risk_score: 50,
      categories: ['unknown'],
      description: 'Risk check unavailable (service not configured)',
    });
  }

  try {
    const response = await fetch(
      `https://api.chainalysis.com/api/v2/address/${address}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Upstream service error: ${response.status}`, detail: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 502 }
    );
  }
}

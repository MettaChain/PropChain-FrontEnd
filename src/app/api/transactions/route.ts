import { NextRequest, NextResponse } from 'next/server';
import { getMockApiTransactions } from '@/lib/mockTransactionData';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const walletAddress = searchParams.get('walletAddress')?.trim();

  if (!walletAddress) {
    return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
  }

  if (walletAddress.length < 6) {
    return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
  }

  return NextResponse.json(getMockApiTransactions());
}

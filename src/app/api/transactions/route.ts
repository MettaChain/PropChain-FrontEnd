import { NextRequest, NextResponse } from 'next/server';
import { getMockApiTransactions } from '@/lib/mockTransactionData';

const EVM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const walletAddress = searchParams.get('walletAddress')?.trim();

  if (!walletAddress) {
    return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
  }

  if (!EVM_ADDRESS_REGEX.test(walletAddress)) {
    return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
  }

  return NextResponse.json(getMockApiTransactions(walletAddress));
}

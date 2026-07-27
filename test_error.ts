export const WEB3_ERROR_MAP: Record<string, string> = {
  '4001': 'Transaction rejected. Please confirm the request in your wallet to proceed.',
  '-32603': 'Internal node processing error. Please try again or switch RPC networks.',
  'INSUFFICIENT_SUMS_OR_FUNDS': 'Insufficient funds. You do not have enough ETH to cover the transaction and gas fees.',
  'UNPREDICTABLE_GAS_LIMIT': 'Transaction simulation failed. The smart contract execution will revert.',
  'NETWORK_ERROR': 'Connection failed. Unable to reach the blockchain RPC network provider.',
};

export function parseWeb3Error(error: any): string {
  if (!error) return 'An unknown blockchain error occurred.';
  const code = error.code?.toString() || '';
  const message = error.message?.toUpperCase() || '';
  const dataMessage = error.data?.message?.toUpperCase() || '';

  if (WEB3_ERROR_MAP[code]) return WEB3_ERROR_MAP[code];
  if (message.includes('INSUFFICIENT') || dataMessage.includes('INSUFFICIENT')) return WEB3_ERROR_MAP['INSUFFICIENT_SUMS_OR_FUNDS'];
  if (message.includes('GAS_LIMIT') || dataMessage.includes('GAS_LIMIT') || message.includes('REVERT')) return WEB3_ERROR_MAP['UNPREDICTABLE_GAS_LIMIT'];
  if (message.includes('NETWORK') || message.includes('FETCH') || message.includes('TIMEOUT')) return WEB3_ERROR_MAP['NETWORK_ERROR'];

  return error.message || 'A network error occurred during transaction processing.';
}

console.log('🚀 Starting Web3 Error Handler Simulation Tests...\n');
console.log(`❌ Input Code 4001 -> ✅ Output: "${parseWeb3Error({ code: 4001 })}"`);
console.log(`❌ Input Insufficient Gas -> ✅ Output: "${parseWeb3Error({ message: 'insufficient funds for gas' })}"`);

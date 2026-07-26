export interface WalletPattern {
  name: string;
  patterns: (string | RegExp)[];
}

export const KNOWN_WALLET_PATTERN_REGISTRY: Record<string, WalletPattern> = {
  MetaMask: {
    name: 'MetaMask',
    patterns: [
      process.env.NEXT_PUBLIC_METAMASK_EXTENSION_ID || 'nkbihfbeogaeaoehlefnkodbefgpgknn',
      'bfnaelmomeimhlpmgjnjophhpkkoljpa',
      'evmask.js',
      'evmAsk.js',
      'selectExtension'
    ],
  },
  Rabby: {
    name: 'Rabby',
    patterns: [
      process.env.NEXT_PUBLIC_RABBY_EXTENSION_ID || 'acmacodkjbdgmoleebolmdjonilkdbch'
    ],
  },
  Coinbase: {
    name: 'Coinbase',
    patterns: [
      process.env.NEXT_PUBLIC_COINBASE_EXTENSION_ID || 'hnfanknocfeofbddgcijnmhnfnkdnaad'
    ],
  },
  Trust: {
    name: 'Trust',
    patterns: [
      process.env.NEXT_PUBLIC_TRUST_EXTENSION_ID || 'egjidjbpglichdcondbcbdnbeeppgdph'
    ],
  },
  Phantom: {
    name: 'Phantom',
    patterns: [
      process.env.NEXT_PUBLIC_PHANTOM_EXTENSION_ID || 'bfnaelmomeimhlpmgjnjophhpkkoljpa'
    ],
  }
};

export const isVerboseExtensionErrorsEnabled = () => {
  return process.env.NEXT_PUBLIC_VERBOSE_EXTENSION_ERRORS === 'true';
};

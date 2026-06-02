'use client';

import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

interface Web3Term {
  term: string;
  definition: string;
  example?: string;
}

const web3Terms: Record<string, Web3Term> = {
  'gas fee': {
    term: 'Gas Fee',
    definition: 'A fee paid to blockchain validators for processing transactions on the network.',
    example: 'Typical gas fees range from $5-50 depending on network congestion.'
  },
  'gas': {
    term: 'Gas Fee',
    definition: 'A fee paid to blockchain validators for processing transactions on the network.',
    example: 'Typical gas fees range from $5-50 depending on network congestion.'
  },
  'token': {
    term: 'Token',
    definition: 'A digital asset built on blockchain technology that represents ownership or utility.',
    example: 'Property tokens represent fractional ownership of real estate assets.'
  },
  'tokenization': {
    term: 'Tokenization',
    definition: 'The process of converting rights to an asset into a digital token on a blockchain.',
    example: 'A $1M property can be tokenized into 1,000 tokens worth $1,000 each.'
  },
  'smart contract': {
    term: 'Smart Contract',
    definition: 'Self-executing contracts with terms directly written into code that automatically execute when conditions are met.',
    example: 'Property transfers automatically execute when payment is confirmed.'
  },
  'yield': {
    term: 'Yield',
    definition: 'The earnings generated from an investment over a period of time, expressed as a percentage.',
    example: 'An 8% annual yield means $8,000 profit on a $100,000 investment.'
  },
  'apy': {
    term: 'APY (Annual Percentage Yield)',
    definition: 'The real rate of return earned on an investment, accounting for compound interest.',
    example: '8% APY with monthly compounding yields more than 8% simple interest.'
  },
  'liquidity': {
    term: 'Liquidity',
    definition: 'How easily an asset can be bought or sold without affecting its market price.',
    example: 'High liquidity means you can quickly sell your tokens at market price.'
  },
  'slippage': {
    term: 'Slippage',
    definition: 'The difference between expected price of a trade and the price at which the trade executes.',
    example: '2% slippage on a $10,000 trade means you receive $9,800 instead of $10,000.'
  },
  'block confirmation': {
    term: 'Block Confirmation',
    definition: 'The process of a transaction being included in a blockchain block, making it irreversible.',
    example: '12 confirmations typically mean a transaction is final and cannot be reversed.'
  },
  'block': {
    term: 'Block',
    definition: 'A batch of transactions recorded together on the blockchain.',
    example: 'Each block contains multiple transactions and is linked to the previous block.'
  },
  'blockchain': {
    term: 'Blockchain',
    definition: 'A distributed ledger technology that records transactions across multiple computers.',
    example: 'Ethereum blockchain enables secure, transparent property transactions.'
  },
  'wallet': {
    term: 'Wallet',
    definition: 'A digital wallet that stores private keys and allows interaction with blockchain networks.',
    example: 'MetaMask is a popular wallet for storing crypto and interacting with dApps.'
  },
  'dapp': {
    term: 'dApp (Decentralized Application)',
    definition: 'An application built on blockchain technology that operates without central control.',
    example: 'PropChain is a dApp for tokenized real estate investment.'
  },
  'defi': {
    term: 'DeFi (Decentralized Finance)',
    definition: 'Financial services built on blockchain technology that operate without traditional intermediaries.',
    example: 'Lending, borrowing, and trading without banks using smart contracts.'
  }
};

interface Web3TooltipProps {
  term: string;
  children?: React.ReactNode;
  className?: string;
  showIcon?: boolean;
}

export const Web3Tooltip: React.FC<Web3TooltipProps> = ({
  term,
  children,
  className = '',
  showIcon = true,
}) => {
  const normalizedTerm = term.toLowerCase();
  const web3Info = web3Terms[normalizedTerm];

  if (!web3Info) {
    return <>{children || term}</>;
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center gap-1 cursor-help border-b border-dotted border-gray-400 hover:border-gray-600 transition-colors ${className}`}>
            {children || term}
            {showIcon && (
              <HelpCircle className="w-3 h-3 text-gray-400 hover:text-gray-600 transition-colors" />
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent 
          className="max-w-xs p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg"
          side="top"
          align="center"
        >
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
              {web3Info.term}
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              {web3Info.definition}
            </p>
            {web3Info.example && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-medium">Example:</span> {web3Info.example}
                </p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Hook to automatically wrap text with Web3 tooltips
export const useWeb3Tooltips = () => {
  const wrapWithTooltip = (text: string, className?: string) => {
    const words = text.split(' ');
    return words.map((word, index) => {
      const cleanWord = word.toLowerCase().replace(/[.,!?;:]/g, '');
      const punctuation = word.match(/[.,!?;:]$/)?.[0] || '';
      
      if (web3Terms[cleanWord]) {
        return (
          <React.Fragment key={index}>
            <Web3Tooltip term={cleanWord} className={className}>
              {word.replace(/[.,!?;:]/g, '')}
            </Web3Tooltip>
            {punctuation}{' '}
          </React.Fragment>
        );
      }
      
      return `${word} `;
    });
  };

  return { wrapWithTooltip };
};

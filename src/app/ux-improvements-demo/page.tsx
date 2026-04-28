'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Web3Tooltip } from '@/components/ui/Web3Tooltip';
import { CopyButton, CopyAddress, CopyTransactionHash, CopyShareLink } from '@/components/ui/CopyButton';
import { TransactionProgress, useTransactionProgress } from '@/components/TransactionProgress';
import { DraggablePropertiesList } from '@/components/dashboard/DraggablePropertiesList';

export default function UXImprovementsDemo() {
  const { isOpen, transactionHash, startTransaction, closeTransaction } = useTransactionProgress();
  const [showDemo, setShowDemo] = useState(false);

  const sampleAddress = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
  const sampleTransactionHash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
  const sampleShareUrl = "https://propchain.io/properties/manhattan-tower";

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">UX Improvements Demo</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Showcase of all four UX improvements implemented for PropChain FrontEnd
        </p>
      </div>

      {/* Issue #145: Drag-and-drop for portfolio reordering */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎯 Issue #145: Drag-and-Drop Portfolio Reordering
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Users can now reorder their portfolio holdings by dragging and dropping property cards. 
            The order is persisted to localStorage and includes keyboard accessibility.
          </p>
          <DraggablePropertiesList />
        </CardContent>
      </Card>

      {/* Issue #144: Web3 terminology tooltips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            💡 Issue #144: Web3 Terminology Tooltips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Educational tooltips help new users understand Web3 terminology. Hover over highlighted terms to see explanations.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Common Web3 Terms:</h4>
              <div className="space-y-2 text-sm">
                <div><Web3Tooltip term="gas fee">Gas fees</Web3Tooltip> are required for blockchain transactions.</div>
                <div><Web3Tooltip term="token">Tokens</Web3Tooltip> represent digital assets on the blockchain.</div>
                <div><Web3Tooltip term="smart contract">Smart contracts</Web3Tooltip> execute automatically when conditions are met.</div>
                <div><Web3Tooltip term="yield">Yield</Web3Tooltip> represents earnings from investments.</div>
                <div><Web3Tooltip term="liquidity">Liquidity</Web3Tooltip> measures how easily assets can be traded.</div>
                <div><Web3Tooltip term="slippage">Slippage</Web3Tooltip> occurs when trade prices differ from expected.</div>
                <div><Web3Tooltip term="block confirmation">Block confirmations</Web3Tooltip> ensure transaction finality.</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Advanced Terms:</h4>
              <div className="space-y-2 text-sm">
                <div><Web3Tooltip term="apy">APY</Web3Tooltip> includes compound interest effects.</div>
                <div><Web3Tooltip term="blockchain">Blockchain</Web3Tooltip> is a distributed ledger technology.</div>
                <div><Web3Tooltip term="wallet">Wallet</Web3Tooltip> stores digital assets securely.</div>
                <div><Web3Tooltip term="defi">DeFi</Web3Tooltip> enables financial services without intermediaries.</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Issue #142: Transaction progress feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ⏳ Issue #142: Step-by-Step Transaction Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Detailed transaction progress shows users exactly what's happening at each step.
          </p>
          
          <div className="flex gap-4">
            <Button onClick={() => startTransaction(sampleTransactionHash)}>
              Simulate Transaction
            </Button>
            <Button variant="outline" onClick={() => setShowDemo(!showDemo)}>
              {showDemo ? 'Hide' : 'Show'} Demo Features
            </Button>
          </div>

          {showDemo && (
            <div className="space-y-2 text-sm">
              <h4 className="font-medium">Features:</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Step-by-step progress indicators</li>
                <li>Real-time confirmation tracking (X/12 blocks)</li>
                <li>Visual feedback for each stage</li>
                <li>Error handling and retry options</li>
                <li>Blockchain security indicators</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Issue #143: Copy-to-clipboard functionality */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📋 Issue #143: Copy-to-Clipboard Functionality
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            One-click copy functionality for wallet addresses, transaction hashes, and sharing property links.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Address Copy:</h4>
              <CopyAddress address={sampleAddress} />
              
              <h4 className="font-medium">Transaction Hash Copy:</h4>
              <CopyTransactionHash 
                hash={sampleTransactionHash} 
                explorerUrl="https://etherscan.io/tx/0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
              />
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">Share Links:</h4>
              <CopyShareLink 
                url={sampleShareUrl}
                title="Share Property"
              />
              
              <h4 className="font-medium">Custom Copy Buttons:</h4>
              <div className="flex gap-2">
                <CopyButton text="Hello, World!" label="Copy Text" />
                <CopyButton text={sampleAddress} variant="icon" />
                <CopyButton text={sampleTransactionHash} variant="text" label="Copy Hash" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Progress Modal */}
      <TransactionProgress
        isOpen={isOpen}
        onClose={closeTransaction}
        transactionHash={transactionHash}
      />
    </div>
  );
}

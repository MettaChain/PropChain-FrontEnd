'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Clock, 
  Info, 
  Wallet,
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useWalletStore } from '@/store/walletStore';
import { toast } from 'sonner';

interface StakingModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'stake' | 'unstake';
  token?: {
    id: string;
    name: string;
    symbol: string;
    amount: number;
    apy: number;
  };
}

const mockAvailableTokens = [
  { id: '1', name: 'Manhattan Tower Suite', symbol: 'MTS', balance: 1200, apy: 12.5 },
  { id: '2', name: 'Sunset Beach Villa', symbol: 'SBV', balance: 540, apy: 10.2 },
  { id: '3', name: 'Tech Hub Office Complex', symbol: 'THO', balance: 2100, apy: 9.5 },
];

export const StakingModal: React.FC<StakingModalProps> = ({ 
  isOpen, 
  onClose, 
  type, 
  token 
}) => {
  const [step, setStep] = useState<'input' | 'confirm' | 'success'>('input');
  const [amount, setAmount] = useState<string>('');
  const [lockPeriod, setLockPeriod] = useState<number>(3); // months
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedToken, setSelectedToken] = useState(token || mockAvailableTokens[0]);

  useEffect(() => {
    if (isOpen) {
      setStep('input');
      setAmount('');
      setLockPeriod(3);
      if (token) {
        setSelectedToken(token);
      }
    }
  }, [isOpen, token]);

  const handleNext = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    setStep('confirm');
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    // Simulate blockchain transaction
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsProcessing(false);
    setStep('success');
    toast.success(`${type === 'stake' ? 'Staked' : 'Unstaked'} ${amount} ${selectedToken.symbol} successfully!`);
  };

  const handleClose = () => {
    onClose();
    // Small delay to reset state after animation
    setTimeout(() => setStep('input'), 300);
  };

  const apyMultiplier = 1 + (lockPeriod / 12) * 0.5; // Simple mock formula
  const projectedApy = (selectedToken.apy * apyMultiplier).toFixed(1);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        {step === 'input' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {type === 'stake' ? 'Stake' : 'Unstake'} Property Tokens
              </DialogTitle>
              <DialogDescription>
                {type === 'stake' 
                  ? 'Lock your tokens to earn rental yield and appreciation rewards.' 
                  : 'Withdraw your tokens from the staking pool.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {!token && type === 'stake' && (
                <div className="space-y-2">
                  <Label>Select Token</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {mockAvailableTokens.map(t => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedToken(t)}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                          selectedToken.id === t.id 
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' 
                            : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">🏠</span>
                          <div className="text-left">
                            <p className="text-sm font-semibold">{t.name}</p>
                            <p className="text-xs text-muted-foreground">{t.balance} {t.symbol} available</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-green-600">{t.apy}% APY</Badge>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="amount">Amount to {type}</Label>
                  <span className="text-xs text-muted-foreground">
                    Max: {type === 'stake' ? selectedToken.balance : (token?.amount || 0)} {selectedToken.symbol}
                  </span>
                </div>
                <div className="relative">
                  <Input
                    id="amount"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pr-16"
                    type="number"
                  />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="absolute right-1 top-1 text-xs h-8"
                    onClick={() => setAmount(String(type === 'stake' ? selectedToken.balance : (token?.amount || 0)))}
                  >
                    MAX
                  </Button>
                </div>
              </div>

              {type === 'stake' && (
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <Label>Lock Period: {lockPeriod} Months</Label>
                    <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                      +{((parseFloat(projectedApy) - selectedToken.apy)).toFixed(1)}% Bonus APY
                    </Badge>
                  </div>
                  <Slider 
                    value={[lockPeriod]} 
                    min={1} 
                    max={24} 
                    step={1} 
                    onValueChange={(vals) => setLockPeriod(vals[0])}
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                    <span>1 Month</span>
                    <span>12 Months</span>
                    <span>24 Months</span>
                  </div>
                </div>
              )}

              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl space-y-2 border border-gray-100 dark:border-gray-800">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Estimated APY</span>
                  <span className="font-bold text-green-600">{type === 'stake' ? projectedApy : selectedToken.apy}%</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Gas Fee (Est.)
                  </span>
                  <span>~0.0008 ETH</span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 text-white">
                Review {type === 'stake' ? 'Staking' : 'Withdrawal'}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'confirm' && (
          <>
            <DialogHeader>
              <DialogTitle>Confirm {type === 'stake' ? 'Stake' : 'Unstake'}</DialogTitle>
              <DialogDescription>
                Please review your transaction details below.
              </DialogDescription>
            </DialogHeader>

            <div className="py-6 space-y-4">
              <div className="flex items-center justify-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border-2 border-dashed border-blue-200 dark:border-blue-800">
                <div className="text-center">
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wider">You are {type}ing</p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{amount} {selectedToken.symbol}</p>
                  <p className="text-sm text-blue-500 mt-1">Value: ~${(parseFloat(amount) * 250).toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-3 px-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Token</span>
                  <span className="font-medium">{selectedToken.name}</span>
                </div>
                {type === 'stake' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Lock Period</span>
                    <span className="font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3 text-indigo-500" />
                      {lockPeriod} Months
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Expected APY</span>
                  <span className="font-medium text-green-600">{type === 'stake' ? projectedApy : selectedToken.apy}%</span>
                </div>
                <div className="pt-3 border-t flex justify-between text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <ShieldCheck className="w-4 h-4 text-blue-500" />
                    Security Check
                  </span>
                  <span className="text-green-600 font-medium">Verified</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex gap-3 border border-amber-100 dark:border-amber-800">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                  {type === 'stake' 
                    ? 'Your tokens will be locked until the period ends. Early withdrawal may incur a 5% penalty.' 
                    : 'Unstaking will stop all yield generation for these tokens immediately.'}
                </p>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="ghost" onClick={() => setStep('input')} disabled={isProcessing}>Back</Button>
              <Button 
                onClick={handleConfirm} 
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Confirming...
                  </>
                ) : (
                  <>Confirm & {type === 'stake' ? 'Stake' : 'Withdraw'}</>
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'success' && (
          <div className="py-8 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Transaction Successful!
            </h3>
            <p className="text-muted-foreground mb-8 max-w-[280px]">
              Your tokens have been successfully {type === 'stake' ? 'staked' : 'withdrawn'}. 
              You can track your earnings in the dashboard.
            </p>
            
            <div className="w-full space-y-3">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={handleClose}>
                Back to Dashboard
              </Button>
              <Button variant="outline" className="w-full" onClick={() => window.open('https://etherscan.io', '_blank')}>
                View on Explorer
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

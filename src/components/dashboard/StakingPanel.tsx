'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Lock, 
  Unlock, 
  Coins, 
  ArrowUpRight, 
  Clock, 
  AlertCircle,
  ChevronRight,
  Info
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { StakingModal } from './StakingModal';

const yieldData = [
  { date: '2026-01', yield: 8.2 },
  { date: '2026-02', yield: 8.5 },
  { date: '2026-03', yield: 9.1 },
  { date: '2026-04', yield: 8.8 },
  { date: '2026-05', yield: 9.4 },
  { date: '2026-06', yield: 10.2 },
  { date: '2026-07', yield: 11.5 },
];

const stakedTokens = [
  {
    id: '1',
    name: 'Manhattan Tower Suite',
    symbol: 'MTS',
    amount: 500,
    value: 250000,
    apy: 12.5,
    rewards: 12.45,
    lockUntil: '2026-12-31',
    lockProgress: 35,
  },
  {
    id: '2',
    name: 'Sunset Beach Villa',
    symbol: 'SBV',
    amount: 200,
    value: 100000,
    apy: 10.2,
    rewards: 5.12,
    lockUntil: '2026-08-15',
    lockProgress: 65,
  },
];

export const StakingPanel: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'stake' | 'unstake'>('stake');
  const [selectedToken, setSelectedToken] = useState<any>(null);

  const handleStake = (token?: any) => {
    setSelectedToken(token || null);
    setModalType('stake');
    setIsModalOpen(true);
  };

  const handleUnstake = (token: any) => {
    setSelectedToken(token);
    setModalType('unstake');
    setIsModalOpen(true);
  };

  const handleClaim = (tokenName: string) => {
    toast.success(`Claiming rewards for ${tokenName}...`, {
      description: 'Estimated gas cost: 0.0012 ETH',
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Staked Value</p>
                <h3 className="text-2xl font-bold mt-1">$350,000</h3>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                <Coins className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-sm text-green-600">
              <TrendingUp className="w-4 h-4" />
              <span>+12.5% APY Avg.</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Rewards</p>
                <h3 className="text-2xl font-bold mt-1">$17.57</h3>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl text-green-600 dark:text-green-400">
                <ArrowUpRight className="w-6 h-6" />
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4 w-full"
              onClick={() => handleClaim('all tokens')}
            >
              Claim All
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Stakes</p>
                <h3 className="text-2xl font-bold mt-1">2 Tokens</h3>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400">
                <Lock className="w-6 h-6" />
              </div>
            </div>
            <Button 
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => handleStake()}
            >
              New Stake
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Stakes List */}
        <div className="lg:col-span-2 space-y-4">
          <h4 className="text-lg font-semibold flex items-center gap-2">
            Your Active Stakes
            <Badge variant="secondary">{stakedTokens.length}</Badge>
          </h4>
          
          <div className="grid grid-cols-1 gap-4">
            {stakedTokens.map((token) => (
              <Card key={token.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-xl">
                          🏠
                        </div>
                        <div>
                          <h5 className="font-bold">{token.name}</h5>
                          <p className="text-sm text-muted-foreground">{token.amount} {token.symbol}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase">Current APY</p>
                          <p className="font-semibold text-green-600">{token.apy}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase">Earned</p>
                          <p className="font-semibold">${token.rewards}</p>
                        </div>
                        <div className="hidden md:block">
                          <p className="text-xs text-muted-foreground uppercase">Value</p>
                          <p className="font-semibold">${token.value.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleClaim(token.name)}>
                          Claim
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => handleUnstake(token)}>
                          Unstake
                        </Button>
                      </div>
                    </div>

                    <div className="mt-6 space-y-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          Lock Period
                        </span>
                        <span className="font-medium text-blue-600">Until {token.lockUntil}</span>
                      </div>
                      <Progress value={token.lockProgress} className="h-1.5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Yield Chart & Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Historical Yield
              </CardTitle>
              <CardDescription>Aggregate APY across all pools</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={yieldData}>
                    <defs>
                      <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="date" 
                      hide 
                    />
                    <YAxis 
                      hide 
                      domain={['dataMin - 1', 'dataMax + 1']}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '12px', 
                        border: 'none', 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                      }}
                      formatter={(value: number) => [`${value}%`, 'APY']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="yield" 
                      stroke="#2563eb" 
                      fillOpacity={1} 
                      fill="url(#colorYield)" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    Yields are calculated based on rental income and property appreciation. 
                    Staking lock periods increase your APY multiplier.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-600 to-blue-700 text-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-indigo-200" />
                <h5 className="font-semibold">Yield Optimization</h5>
              </div>
              <p className="text-sm text-indigo-100 mb-6">
                You can increase your current yield by 2.5% by locking your MTS tokens for an additional 6 months.
              </p>
              <Button className="w-full bg-white text-blue-700 hover:bg-indigo-50 font-semibold">
                Optimize Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <StakingModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type={modalType}
        token={selectedToken}
      />
    </div>
  );
};

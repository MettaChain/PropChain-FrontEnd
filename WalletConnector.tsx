import React, { useState } from 'react';
import { useWalletStore } from '@/store/walletStore';
import { useWalletConnector } from '@/hooks/useWalletConnector';
import { Button } from '@/components/ui/button';
import { WalletModal } from '@/components/WalletModal';
import { NetworkBadge } from './NetworkBadge';
import { CopyButton } from '@/components/ui/CopyButton';
import { 
  Loader2, 
  LogOut, 
  Wallet, 
  ChevronDown,
  ShieldCheck
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

export const WalletConnector: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isConnected, address, chainId, disconnect, isConnecting } = useWalletStore();
  const { isLoadingConnector } = useWalletConnector();

  // Show connecting state if either the chunk is loading or the wallet is authenticating
  const isPending = isConnecting || isLoadingConnector;

  const handleDisconnect = () => {
    disconnect();
  };

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  if (!isConnected) {
    return (
      <>
        <Button 
          onClick={() => setIsModalOpen(true)}
          disabled={isPending}
          className="flex items-center gap-2"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Wallet className="h-4 w-4" />
          )}
          {isPending ? 'Connecting...' : 'Connect Wallet'}
        </Button>

        <WalletModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
        />
      </>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Network detection happens inside the Badge */}
      <NetworkBadge chainId={chainId} />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2 px-3">
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-xs font-medium text-muted-foreground uppercase">Connected</span>
              <span className="text-sm font-mono">{formatAddress(address!)}</span>
            </div>
            <div className="sm:hidden">
              <Wallet className="h-4 w-4" />
            </div>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-56">
          <div className="flex items-center justify-between p-2">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Wallet Address</span>
              <span className="text-sm font-mono truncate max-w-[140px]">{address}</span>
            </div>
            <CopyButton text={address!} variant="icon" />
          </div>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem className="flex items-center gap-2 cursor-default">
            <ShieldCheck className="h-4 w-4 text-green-500" />
            <div className="flex flex-col">
              <span className="text-sm">KYC Status</span>
              <span className="text-xs text-green-500 font-medium">Verified</span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem 
            onClick={handleDisconnect}
            className="text-destructive focus:text-destructive flex items-center gap-2 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Disconnect</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
'use client';

import { usePaperTradingStore } from '@/store/paperTradingStore';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

export function PaperTradingToggle() {
  const { isPaperMode, togglePaperMode } = usePaperTradingStore();

  return (
    <div className="flex items-center gap-2">
      <Switch
        id="paper-trading-toggle"
        checked={isPaperMode}
        onCheckedChange={togglePaperMode}
        aria-label="Toggle paper trading mode"
      />
      <label htmlFor="paper-trading-toggle" className="text-sm font-medium cursor-pointer select-none">
        Paper Trading
      </label>
      {isPaperMode && (
        <Badge variant="secondary" className="text-xs">
          Simulation
        </Badge>
      )}
    </div>
  );
}

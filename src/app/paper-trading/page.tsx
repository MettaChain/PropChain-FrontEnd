import { PaperTradingToggle } from '@/components/PaperTradingToggle';
import { PaperTradingDashboard } from '@/components/PaperTradingDashboard';

export default function PaperTradingPage() {
  return (
    <main className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Paper Trading</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Simulate property token investments with $10,000 virtual funds — no real money at risk.
          </p>
        </div>
        <PaperTradingToggle />
      </div>
      <PaperTradingDashboard />
    </main>
  );
}

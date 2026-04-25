/**
 * Referral Dashboard Page
 * Route: /referral
 */

import ReferralDashboard from '@/components/referral/ReferralDashboard';

export const metadata = {
  title: 'Referral Program - PropChain',
  description: 'Earn rewards by referring investors to PropChain',
};

export default function ReferralPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-7xl px-4">
        <ReferralDashboard showLeaderboard={true} />
      </div>
    </main>
  );
}

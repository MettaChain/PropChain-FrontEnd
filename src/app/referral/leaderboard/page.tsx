/**
 * Referral Leaderboard Page
 * Route: /referral/leaderboard
 */

import ReferralLeaderboard from '@/components/referral/ReferralLeaderboard';

export const metadata = {
  title: 'Referral Leaderboard - PropChain',
  description: 'View top referrers in the PropChain referral program',
};

export default function LeaderboardPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-6xl px-4">
        <ReferralLeaderboard limit={50} />
      </div>
    </main>
  );
}

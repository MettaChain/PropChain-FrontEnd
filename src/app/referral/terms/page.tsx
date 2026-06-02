/**
 * Referral Terms and Conditions Page
 * Route: /referral/terms
 */

import ReferralTermsPage from '@/components/referral/ReferralTermsPage';

export const metadata = {
  title: 'Referral Terms & Conditions - PropChain',
  description: 'Terms and conditions for the PropChain referral program',
};

export default function TermsPage() {
  return <ReferralTermsPage />;
}

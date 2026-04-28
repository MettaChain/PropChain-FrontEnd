'use client';

/**
 * Referral Terms and Conditions Page
 */

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useReferralStore } from '@/store/referralStore';
import { referralService } from '@/lib/referralService';
import { createWalletAddress } from '@/types/referral';
import Link from 'next/link';

export default function ReferralTermsPage() {
  const { address, isConnected } = useAccount();
  const [isAccepting, setIsAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const { termsAccepted, updateTermsAccepted, setNotification } =
    useReferralStore();

  useEffect(() => {
    setAccepted(termsAccepted);
  }, [termsAccepted]);

  const handleAccept = async () => {
    if (!address) return;

    try {
      setIsAccepting(true);
      const walletAddress = createWalletAddress(address);

      await referralService.acceptTermsAndConditions(
        walletAddress,
        '1.0'
      );

      updateTermsAccepted(true);
      setAccepted(true);
      setNotification('Terms accepted successfully!', 'success');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to accept terms';
      setNotification(message, 'error');
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/referral"
            className="mb-4 inline-flex items-center text-blue-600 hover:text-blue-700"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-slate-900">
            Referral Program Terms & Conditions
          </h1>
          <p className="mt-2 text-slate-600">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8 rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          {/* 1. Eligibility */}
          <section>
            <h2 className="mb-4 text-2xl font-bold text-slate-900">
              1. Program Eligibility
            </h2>
            <div className="space-y-3 text-slate-700">
              <p>
                To participate in the PropChain Referral Program, you must:
              </p>
              <ul className="list-inside space-y-2 pl-4">
                <li>• Be at least 18 years old</li>
                <li>• Have a valid Web3 wallet connected to PropChain</li>
                <li>• Comply with all applicable laws and regulations</li>
                <li>
                  • Not be a resident of a jurisdiction where the referral program is
                  prohibited
                </li>
                <li>• Agree to these Terms and Conditions</li>
              </ul>
            </div>
          </section>

          {/* 2. How It Works */}
          <section>
            <h2 className="mb-4 text-2xl font-bold text-slate-900">
              2. How the Referral Program Works
            </h2>
            <div className="space-y-3 text-slate-700">
              <p>
                The referral program allows you to earn rewards by referring new
                investors to PropChain:
              </p>
              <ol className="list-inside space-y-2 pl-4">
                <li>
                  1. Generate a unique referral link through your dashboard
                </li>
                <li>
                  2. Share the link with potential investors in your network
                </li>
                <li>
                  3. When someone clicks your link and creates an account, you
                  receive a reward
                </li>
                <li>
                  4. Upon signup conversion, you earn an additional bonus reward
                </li>
                <li>5. Claim your accumulated rewards on-chain</li>
              </ol>
            </div>
          </section>

          {/* 3. Reward Structure */}
          <section>
            <h2 className="mb-4 text-2xl font-bold text-slate-900">
              3. Reward Structure
            </h2>
            <div className="space-y-3 text-slate-700">
              <p>Referral rewards are structured as follows:</p>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-300 px-4 py-2 text-left">
                        Event
                      </th>
                      <th className="border border-slate-300 px-4 py-2 text-left">
                        Base Reward
                      </th>
                      <th className="border border-slate-300 px-4 py-2 text-left">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-300 px-4 py-2">
                        Referral Click
                      </td>
                      <td className="border border-slate-300 px-4 py-2">
                        Tracked
                      </td>
                      <td className="border border-slate-300 px-4 py-2">
                        No immediate reward
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 px-4 py-2">
                        Account Signup
                      </td>
                      <td className="border border-slate-300 px-4 py-2">
                        Variable
                      </td>
                      <td className="border border-slate-300 px-4 py-2">
                        Based on program settings
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 px-4 py-2">
                        First Purchase
                      </td>
                      <td className="border border-slate-300 px-4 py-2">
                        Optional Bonus
                      </td>
                      <td className="border border-slate-300 px-4 py-2">
                        When enabled
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-sm italic">
                * Reward amounts are specified in the program dashboard and may
                change
              </p>
            </div>
          </section>

          {/* 4. Reward Tiers */}
          <section>
            <h2 className="mb-4 text-2xl font-bold text-slate-900">
              4. Reward Tier System
            </h2>
            <div className="space-y-3 text-slate-700">
              <p>
                Referrers advance through tiers based on successful signups:
              </p>
              <div className="space-y-3">
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="font-semibold">🥉 Bronze Tier: 0-10 Signups</p>
                  <p className="text-sm">Base reward structure</p>
                </div>
                <div className="rounded-lg border border-slate-300 bg-slate-50 p-4">
                  <p className="font-semibold">🥈 Silver Tier: 11-50 Signups</p>
                  <p className="text-sm">10% reward multiplier</p>
                </div>
                <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4">
                  <p className="font-semibold">🥇 Gold Tier: 51-100 Signups</p>
                  <p className="text-sm">25% reward multiplier</p>
                </div>
                <div className="rounded-lg border border-purple-300 bg-purple-50 p-4">
                  <p className="font-semibold">👑 Platinum Tier: 100+ Signups</p>
                  <p className="text-sm">50% reward multiplier + exclusive perks</p>
                </div>
              </div>
            </div>
          </section>

          {/* 5. On-Chain Distribution */}
          <section>
            <h2 className="mb-4 text-2xl font-bold text-slate-900">
              5. On-Chain Reward Distribution
            </h2>
            <div className="space-y-3 text-slate-700">
              <p>
                Rewards are distributed directly to your connected wallet via
                smart contracts:
              </p>
              <ul className="list-inside space-y-2 pl-4">
                <li>
                  • Rewards are distributed on supported blockchain networks
                  (Ethereum, Polygon, BSC)
                </li>
                <li>
                  • Gas fees for claiming rewards are paid from the reward
                  amount
                </li>
                <li>
                  • Claimed rewards are irreversible and final once confirmed
                  on-chain
                </li>
                <li>
                  • Unclaimed rewards may expire after a specified period
                </li>
                <li>
                  • You are responsible for managing your private keys and
                  wallet security
                </li>
              </ul>
            </div>
          </section>

          {/* 6. Prohibited Activities */}
          <section>
            <h2 className="mb-4 text-2xl font-bold text-slate-900">
              6. Prohibited Activities
            </h2>
            <div className="space-y-3 text-slate-700">
              <p>
                You agree not to engage in any of the following activities:
              </p>
              <ul className="list-inside space-y-2 pl-4">
                <li>
                  • Self-referrals (creating multiple accounts to refer to each
                  other)
                </li>
                <li>• Fraudulent or misleading referral practices</li>
                <li>
                  • Violating any applicable laws or regulations in your
                  jurisdiction
                </li>
                <li>
                  • Spamming, phishing, or other forms of unsolicited contact
                </li>
                <li>
                  • Using referral links for commercial advertising without
                  permission
                </li>
                <li>
                  • Manipulating referral data or attempting to game the system
                </li>
                <li>
                  • Using multiple referral links to artificially inflate
                  statistics
                </li>
              </ul>
            </div>
          </section>

          {/* 7. Verification and Fraud */}
          <section>
            <h2 className="mb-4 text-2xl font-bold text-slate-900">
              7. Verification and Fraud Prevention
            </h2>
            <div className="space-y-3 text-slate-700">
              <p>
                PropChain reserves the right to:
              </p>
              <ul className="list-inside space-y-2 pl-4">
                <li>
                  • Verify referral claims and account legitimacy at any time
                </li>
                <li>
                  • Suspend or terminate referrals if fraud is suspected
                </li>
                <li>
                  • Recover improperly obtained rewards through clawback
                  procedures
                </li>
                <li>
                  • Perform KYC/AML checks on referrers as required by law
                </li>
              </ul>
            </div>
          </section>

          {/* 8. Liability Disclaimer */}
          <section>
            <h2 className="mb-4 text-2xl font-bold text-slate-900">
              8. Liability Disclaimer
            </h2>
            <div className="space-y-3 text-slate-700">
              <p>
                PropChain shall not be liable for:
              </p>
              <ul className="list-inside space-y-2 pl-4">
                <li>• Network outages or blockchain delays</li>
                <li>• Smart contract failures or bugs</li>
                <li>• Loss of wallet access or private keys</li>
                <li>• Gas fee fluctuations</li>
                <li>• Regulatory changes affecting the program</li>
              </ul>
              <p className="mt-3 rounded-lg bg-yellow-50 p-3 text-sm">
                <strong>Disclaimer:</strong> The referral program is provided
                &quot;as-is&quot; without warranties. Participate at your own
                risk. PropChain is not responsible for any losses incurred.
              </p>
            </div>
          </section>

          {/* 9. Program Modifications */}
          <section>
            <h2 className="mb-4 text-2xl font-bold text-slate-900">
              9. Program Modifications and Termination
            </h2>
            <div className="space-y-3 text-slate-700">
              <ul className="list-inside space-y-2 pl-4">
                <li>
                  • PropChain may modify or terminate the referral program at
                  any time
                </li>
                <li>• Changes will be communicated with 30 days notice</li>
                <li>
                  • Your continued participation constitutes acceptance of
                  modifications
                </li>
                <li>
                  • Unclaimed rewards may be forfeited if the program is
                  terminated
                </li>
              </ul>
            </div>
          </section>

          {/* 10. Privacy and Data */}
          <section>
            <h2 className="mb-4 text-2xl font-bold text-slate-900">
              10. Privacy and Data Usage
            </h2>
            <div className="space-y-3 text-slate-700">
              <p>
                By participating in the referral program, you agree that
                PropChain may:
              </p>
              <ul className="list-inside space-y-2 pl-4">
                <li>
                  • Collect and store your wallet address and referral data
                </li>
                <li>• Display your stats on the public leaderboard</li>
                <li>• Use aggregated data for program analytics</li>
                <li>• Share data with regulatory bodies if required</li>
              </ul>
              <p className="mt-3">
                See our{' '}
                <Link href="/privacy" className="text-blue-600 hover:text-blue-700">
                  Privacy Policy
                </Link>{' '}
                for full details.
              </p>
            </div>
          </section>

          {/* 11. Contact */}
          <section>
            <h2 className="mb-4 text-2xl font-bold text-slate-900">
              11. Contact and Support
            </h2>
            <div className="space-y-3 text-slate-700">
              <p>For questions about the referral program, please contact:</p>
              <ul className="list-inside space-y-2 pl-4">
                <li>• Email: referrals@propchain.io</li>
                <li>• Discord: https://discord.gg/propchain</li>
                <li>• Support Portal: https://support.propchain.io</li>
              </ul>
            </div>
          </section>

          {/* Acceptance */}
          {isConnected && (
            <div className="border-t border-slate-300 pt-8">
              <div className="rounded-lg bg-blue-50 p-6">
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    id="accept-terms"
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                    className="mt-1 h-5 w-5 rounded border-slate-300"
                  />
                  <label htmlFor="accept-terms" className="flex-1 text-slate-700">
                    I have read and agree to the PropChain Referral Program
                    Terms and Conditions. I understand that participation is
                    subject to these terms and that PropChain may enforce these
                    terms at any time.
                  </label>
                </div>

                <button
                  onClick={handleAccept}
                  disabled={!accepted || isAccepting || termsAccepted}
                  className="mt-6 w-full rounded-lg bg-green-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                >
                  {isAccepting
                    ? 'Accepting...'
                    : termsAccepted
                    ? '✓ Terms Accepted'
                    : 'Accept Terms & Conditions'}
                </button>
              </div>
            </div>
          )}

          {!isConnected && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-center text-yellow-800">
              Please connect your wallet to accept the terms and conditions
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

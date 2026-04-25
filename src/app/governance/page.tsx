'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { WalletConnector } from '@/components/WalletConnector';

// ─── Types ────────────────────────────────────────────────────────────────────

type VoteChoice = 'yes' | 'no' | 'abstain';

interface Proposal {
  id: string;
  propertyId: string;
  propertyName: string;
  title: string;
  description: string;
  proposer: string;
  deadline: string; // ISO date
  votes: { yes: number; no: number; abstain: number };
  totalTokens: number; // total eligible tokens
  status: 'active' | 'passed' | 'rejected' | 'pending';
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_PROPOSALS: Proposal[] = [
  {
    id: 'prop-1',
    propertyId: '1',
    propertyName: 'Luxury Downtown Penthouse',
    title: 'Approve Rooftop Solar Panel Installation',
    description:
      'Install solar panels on the rooftop to reduce energy costs by an estimated 30% annually. Total cost: $85,000. Payback period: ~4 years. This will increase the property\'s sustainability rating and long-term value.',
    proposer: '0xAbCd...1234',
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    votes: { yes: 18500, no: 4200, abstain: 1300 },
    totalTokens: 50000,
    status: 'active',
  },
  {
    id: 'prop-2',
    propertyId: '2',
    propertyName: 'Modern Office Complex',
    title: 'Increase Property Management Fee',
    description:
      'Proposal to increase the annual property management fee from 8% to 10% of rental income to cover rising operational costs and improve service quality.',
    proposer: '0xDeFg...5678',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    votes: { yes: 9000, no: 12000, abstain: 2000 },
    totalTokens: 40000,
    status: 'active',
  },
  {
    id: 'prop-3',
    propertyId: '3',
    propertyName: 'Beachfront Villa',
    title: 'Approve Short-Term Rental Program',
    description:
      'Allow the property to participate in a short-term rental program (Airbnb/VRBO) during off-peak seasons to maximize rental income for token holders.',
    proposer: '0xHiJk...9012',
    deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    votes: { yes: 22000, no: 5000, abstain: 3000 },
    totalTokens: 30000,
    status: 'passed',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useCountdown(deadline: string) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const update = () => {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('Ended'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m`);
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [deadline]);

  return timeLeft;
}

function VoteBar({ yes, no, abstain }: { yes: number; no: number; abstain: number }) {
  const total = yes + no + abstain || 1;
  const yesPct = (yes / total) * 100;
  const noPct = (no / total) * 100;
  const abstainPct = (abstain / total) * 100;

  return (
    <div>
      <div
        className="flex h-3 rounded-full overflow-hidden"
        role="img"
        aria-label={`Vote breakdown: ${yesPct.toFixed(1)}% yes, ${noPct.toFixed(1)}% no, ${abstainPct.toFixed(1)}% abstain`}
      >
        <div className="bg-green-500" style={{ width: `${yesPct}%` }} />
        <div className="bg-red-500" style={{ width: `${noPct}%` }} />
        <div className="bg-gray-400" style={{ width: `${abstainPct}%` }} />
      </div>
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
        <span className="text-green-600 dark:text-green-400">Yes {yesPct.toFixed(1)}%</span>
        <span className="text-red-600 dark:text-red-400">No {noPct.toFixed(1)}%</span>
        <span>Abstain {abstainPct.toFixed(1)}%</span>
      </div>
    </div>
  );
}

function ProposalCard({
  proposal,
  userVotes,
  onVote,
}: {
  proposal: Proposal;
  userVotes: Record<string, VoteChoice>;
  onVote: (proposalId: string, choice: VoteChoice) => void;
}) {
  const countdown = useCountdown(proposal.deadline);
  const userVote = userVotes[proposal.id];
  const isActive = proposal.status === 'active';
  const totalVoted = proposal.votes.yes + proposal.votes.no + proposal.votes.abstain;
  const participation = ((totalVoted / proposal.totalTokens) * 100).toFixed(1);

  // Simulated user token weight (500 tokens)
  const userTokens = 500;

  const statusColors: Record<Proposal['status'], string> = {
    active: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    passed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  };

  return (
    <article
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
      aria-labelledby={`proposal-title-${proposal.id}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[proposal.status]}`}>
              {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{proposal.propertyName}</span>
          </div>
          <h2 id={`proposal-title-${proposal.id}`} className="text-lg font-semibold text-gray-900 dark:text-white">
            {proposal.title}
          </h2>
        </div>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">{proposal.description}</p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4 text-center text-sm">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
          <p className="font-semibold text-gray-900 dark:text-white">{totalVoted.toLocaleString()}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Votes Cast</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
          <p className="font-semibold text-gray-900 dark:text-white">{participation}%</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Participation</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
          <p className={`font-semibold ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
            {countdown}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{isActive ? 'Remaining' : 'Status'}</p>
        </div>
      </div>

      {/* Vote bar */}
      <div className="mb-4">
        <VoteBar {...proposal.votes} />
      </div>

      {/* Voting buttons */}
      {isActive && (
        <fieldset>
          <legend className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Cast your vote
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">(weight: {userTokens.toLocaleString()} tokens)</span>
          </legend>
          <div className="flex gap-2" role="group" aria-label="Vote options">
            {(['yes', 'no', 'abstain'] as VoteChoice[]).map((choice) => {
              const isSelected = userVote === choice;
              const colors: Record<VoteChoice, string> = {
                yes: isSelected
                  ? 'bg-green-600 text-white border-green-600'
                  : 'border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20',
                no: isSelected
                  ? 'bg-red-600 text-white border-red-600'
                  : 'border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20',
                abstain: isSelected
                  ? 'bg-gray-500 text-white border-gray-500'
                  : 'border-gray-400 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700',
              };
              return (
                <button
                  key={choice}
                  type="button"
                  onClick={() => onVote(proposal.id, choice)}
                  aria-pressed={isSelected}
                  className={`flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 capitalize ${colors[choice]}`}
                >
                  {choice}
                </button>
              );
            })}
          </div>
          {userVote && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2" role="status" aria-live="polite">
              ✓ You voted <strong>{userVote}</strong> with {userTokens.toLocaleString()} tokens
            </p>
          )}
        </fieldset>
      )}

      {/* Proposer */}
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
        Proposed by {proposal.proposer} · Deadline: {new Date(proposal.deadline).toLocaleDateString()}
      </p>
    </article>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GovernancePage() {
  const [proposals, setProposals] = useState<Proposal[]>(MOCK_PROPOSALS);
  const [userVotes, setUserVotes] = useState<Record<string, VoteChoice>>({});
  const [filter, setFilter] = useState<'all' | Proposal['status']>('all');

  const handleVote = useCallback((proposalId: string, choice: VoteChoice) => {
    const prev = userVotes[proposalId];
    if (prev === choice) return; // no change

    setProposals((ps) =>
      ps.map((p) => {
        if (p.id !== proposalId) return p;
        const votes = { ...p.votes };
        // Remove previous vote
        if (prev) votes[prev] = Math.max(0, votes[prev] - 500);
        // Add new vote
        votes[choice] += 500;
        return { ...p, votes };
      })
    );
    setUserVotes((v) => ({ ...v, [proposalId]: choice }));
  }, [userVotes]);

  const filtered = filter === 'all' ? proposals : proposals.filter((p) => p.status === filter);
  const activeCount = proposals.filter((p) => p.status === 'active').length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-3" aria-label="PropChain home">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center" aria-hidden="true">
                <span className="text-white font-bold text-sm">PC</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">PropChain</span>
            </Link>
            <WalletConnector />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Governance</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Vote on property management decisions. Your vote weight is proportional to your token holdings.
          </p>
          {activeCount > 0 && (
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1" role="status">
              {activeCount} active proposal{activeCount !== 1 ? 's' : ''} require your vote
            </p>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6" role="tablist" aria-label="Filter proposals">
          {(['all', 'active', 'passed', 'rejected', 'pending'] as const).map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Proposals list */}
        <div className="space-y-6" role="tabpanel" aria-label={`${filter} proposals`}>
          {filtered.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-12">No proposals found.</p>
          ) : (
            filtered.map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                userVotes={userVotes}
                onVote={handleVote}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}

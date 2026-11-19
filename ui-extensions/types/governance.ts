export enum ProposalStatus {
  Draft = 'draft',
  Active = 'active',
  Passed = 'passed',
  Rejected = 'rejected',
  Executed = 'executed',
  Cancelled = 'cancelled',
}

export enum ProposalType {
  Parameter = 'parameter',
  Treasury = 'treasury',
  Upgrade = 'upgrade',
  General = 'general',
}

export interface GovernanceProposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  type: ProposalType;
  status: ProposalStatus;
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  votesFor: string; // token amounts as decimal strings
  votesAgainst: string;
  votesAbstain: string;
}

export interface ProposalVote {
  proposalId: string;
  voter: string;
  support: 'for' | 'against' | 'abstain';
  weight: string;
  castAt: string; // ISO 8601
  reason?: string;
}

export interface Delegate {
  address: string;
  name?: string;
  votingPower: string;
  delegators: number;
}

export interface VotingPower {
  address: string;
  own: string;
  delegated: string;
  total: string;
  delegatee?: string;
}

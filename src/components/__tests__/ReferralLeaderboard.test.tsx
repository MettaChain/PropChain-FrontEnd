import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReferralLeaderboard from '@/components/referral/ReferralLeaderboard';
import { ReferralTier } from '@/types/referral';

// --- mocks ---

jest.mock('wagmi', () => ({
  useAccount: jest.fn(),
}));

jest.mock('@/store/referralStore', () => ({
  useLeaderboardCache: jest.fn(() => null),
  useReferralStore: jest.fn(() => ({
    setLeaderboardLoading: jest.fn(),
    setError: jest.fn(),
  })),
}));

jest.mock('@/lib/referralService', () => ({
  referralService: {
    getLeaderboard: jest.fn(),
  },
}));

jest.mock('@/components/ui/LoadingSkeletons', () => ({
  TableSkeleton: () => <div data-testid="table-skeleton" />,
}));

import { useAccount } from 'wagmi';
import { useReferralStore } from '@/store/referralStore';
import { referralService } from '@/lib/referralService';

const mockUseAccount = useAccount as jest.Mock;
const mockGetLeaderboard = referralService.getLeaderboard as jest.Mock;

const sampleEntries = [
  {
    rank: 1,
    referrerId: '0xAAAA000000000000000000000000000000000001',
    displayName: 'Alice',
    tier: ReferralTier.GOLD,
    totalRewardsEarned: '1000000000000000000',
    totalSignups: 80,
    profileImage: null,
  },
  {
    rank: 2,
    referrerId: '0xBBBB000000000000000000000000000000000002',
    displayName: 'Bob',
    tier: ReferralTier.SILVER,
    totalRewardsEarned: '500000000000000000',
    totalSignups: 30,
    profileImage: null,
  },
];

const userEntry = {
  rank: 5,
  referrerId: '0xCCCC000000000000000000000000000000000003',
  displayName: 'Me',
  tier: ReferralTier.BRONZE,
  totalRewardsEarned: '100000000000000000',
  totalSignups: 5,
  profileImage: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUseAccount.mockReturnValue({ address: '0xCCCC000000000000000000000000000000000003', chainId: 1 });
  mockGetLeaderboard.mockResolvedValue({ entries: sampleEntries, userEntry });
});

describe('ReferralLeaderboard', () => {
  it('shows connect-wallet prompt when no address', async () => {
    mockUseAccount.mockReturnValue({ address: undefined, chainId: 1 });
    render(<ReferralLeaderboard />);
    expect(await screen.findByText(/connect wallet/i)).toBeInTheDocument();
  });

  it('shows loading skeleton while fetching', () => {
    mockGetLeaderboard.mockReturnValue(new Promise(() => {})); // never resolves
    render(<ReferralLeaderboard />);
    expect(screen.getByTestId('table-skeleton')).toBeInTheDocument();
  });

  it('renders leaderboard entries after successful fetch', async () => {
    render(<ReferralLeaderboard />);
    expect(await screen.findByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('renders user rank card when userEntry is returned', async () => {
    render(<ReferralLeaderboard />);
    expect(await screen.findByText('Your Position')).toBeInTheDocument();
    expect(screen.getByText('#5')).toBeInTheDocument();
  });

  it('shows error message when fetch fails', async () => {
    mockGetLeaderboard.mockRejectedValue(new Error('Network error'));
    render(<ReferralLeaderboard />);
    expect(await screen.findByText('Network error')).toBeInTheDocument();
  });

  it('shows empty state when entries array is empty', async () => {
    mockGetLeaderboard.mockResolvedValue({ entries: [], userEntry: null });
    render(<ReferralLeaderboard />);
    await waitFor(() => expect(screen.queryByTestId('table-skeleton')).not.toBeInTheDocument());
    expect(screen.getByText(/no leaderboard entries found/i)).toBeInTheDocument();
  });

  it('re-fetches when sort option changes', async () => {
    render(<ReferralLeaderboard />);
    await screen.findByText('Alice');

    fireEvent.click(screen.getByRole('button', { name: /top signups/i }));

    await waitFor(() => {
      expect(mockGetLeaderboard).toHaveBeenCalledTimes(2);
      expect(mockGetLeaderboard).toHaveBeenLastCalledWith(
        expect.objectContaining({ sortBy: 'totalSignups' }),
      );
    });
  });

  it('highlights the active sort button', async () => {
    render(<ReferralLeaderboard />);
    await screen.findByText('Alice');

    const rewardsBtn = screen.getByRole('button', { name: /top rewards/i });
    expect(rewardsBtn).toHaveClass('bg-blue-600');

    fireEvent.click(screen.getByRole('button', { name: /most active/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /most active/i })).toHaveClass('bg-blue-600');
      expect(rewardsBtn).not.toHaveClass('bg-blue-600');
    });
  });

  it('does not render user position card when userEntry is null', async () => {
    mockGetLeaderboard.mockResolvedValue({ entries: sampleEntries, userEntry: null });
    render(<ReferralLeaderboard />);
    await screen.findByText('Alice');
    expect(screen.queryByText('Your Position')).not.toBeInTheDocument();
  });
});

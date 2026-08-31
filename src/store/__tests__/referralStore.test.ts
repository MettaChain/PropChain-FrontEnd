import { act, renderHook } from '@testing-library/react';
import { useReferralStore } from '../referral/store';
import type {
  ReferralLink,
  ReferralStats,
  ReferralReward,
  LeaderboardEntry,
  ReferralCampaign,
} from '@/types/referral';
import { ReferralRewardStatus, ReferralTier } from '@/types/referral';

const address = '0xAbCd1234567890AbCd1234567890AbCd12345678' as const;

const mockLink = (code: string): ReferralLink => ({
  code: code as ReferralLink['code'],
  referrerId: address as ReferralLink['referrerId'],
  url: `https://propchain.app/r/${code}`,
  createdAt: Date.now(),
  isActive: true,
});

const mockStats = (): ReferralStats => ({
  referrerId: address as ReferralStats['referrerId'],
  totalClicks: 10,
  totalSignups: 4,
  totalRewardsEarned: '4000000000000000000',
  totalRewardsClaimed: '1000000000000000000',
  pendingRewards: '3000000000000000000',
  conversionRate: 40,
  tier: ReferralTier.BRONZE,
  referralsSinceReset: 4,
  lastActivityAt: Date.now(),
  joinedAt: Date.now(),
});

const mockReward = (id: string): ReferralReward => ({
  id,
  referrerId: address as ReferralReward['referrerId'],
  refereeId: '0xOtherWallet1234567890OtherWallet1234567890' as ReferralReward['refereeId'],
  referralCode: 'ABC123' as ReferralReward['referralCode'],
  rewardAmount: '1000000000000000000',
  rewardToken: '0xToken',
  status: ReferralRewardStatus.PENDING,
  chainId: 1,
  createdAt: Date.now(),
});

const mockLeaderboardEntry = (rank: number): LeaderboardEntry => ({
  rank,
  referrerId: address as LeaderboardEntry['referrerId'],
  displayName: 'Alice',
  totalRewardsEarned: '5000000000000000000',
  totalSignups: 8,
  tier: ReferralTier.SILVER,
  recentActivityScore: 90,
});

describe('referralStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useReferralStore.getState().reset();
  });

  it('starts in the empty initial state', () => {
    const { result } = renderHook(() => useReferralStore());
    expect(result.current.referrerId).toBeNull();
    expect(result.current.currentReferralLinks).toEqual([]);
    expect(result.current.currentStats).toBeNull();
    expect(result.current.recentRewards).toEqual([]);
    expect(result.current.leaderboardCache).toEqual([]);
    expect(result.current.termsAccepted).toBe(false);
  });

  it('initializes with a referrer address', async () => {
    const { result } = renderHook(() => useReferralStore());

    await act(async () => {
      await result.current.initialize(address as never);
    });

    expect(result.current.referrerId).toBe(address);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.lastUpdated).not.toBeNull();
  });

  it('adds, removes and replaces referral links', () => {
    const { result } = renderHook(() => useReferralStore());

    act(() => {
      result.current.addReferralLink(mockLink('CODE1'));
      result.current.addReferralLink(mockLink('CODE2'));
    });
    expect(result.current.currentReferralLinks).toHaveLength(2);

    act(() => {
      result.current.removeReferralLink('CODE1' as never);
    });
    expect(result.current.currentReferralLinks).toHaveLength(1);
    expect(result.current.currentReferralLinks[0].code).toBe('CODE2');

    act(() => {
      result.current.updateReferralLinks([mockLink('CODE3')]);
    });
    expect(result.current.currentReferralLinks).toHaveLength(1);
    expect(result.current.currentReferralLinks[0].code).toBe('CODE3');
  });

  it('tracks the selected referral code', () => {
    const { result } = renderHook(() => useReferralStore());

    act(() => {
      result.current.setSelectedReferralCode('CODE1' as never);
    });

    expect(result.current.selectedReferralCode).toBe('CODE1');

    act(() => {
      result.current.setSelectedReferralCode(null);
    });
    expect(result.current.selectedReferralCode).toBeNull();
  });

  it('updates stats and stamps the lastUpdated timestamp', () => {
    const { result } = renderHook(() => useReferralStore());

    act(() => {
      result.current.updateStats(mockStats());
    });

    expect(result.current.currentStats?.totalSignups).toBe(4);
    expect(result.current.currentStats?.conversionRate).toBe(40);
    expect(result.current.lastUpdated).not.toBeNull();
  });

  it('adds rewards to the top of the recent feed', () => {
    const { result } = renderHook(() => useReferralStore());

    act(() => {
      result.current.addReward(mockReward('r-1'));
      result.current.addReward(mockReward('r-2'));
    });

    expect(result.current.recentRewards).toHaveLength(2);
    expect(result.current.recentRewards[0].id).toBe('r-2');
  });

  it('caps the recent rewards feed at 10 entries', () => {
    const { result } = renderHook(() => useReferralStore());

    act(() => {
      for (let i = 1; i <= 12; i++) {
        result.current.addReward(mockReward(`r-${i}`));
      }
    });

    expect(result.current.recentRewards).toHaveLength(10);
    expect(result.current.recentRewards[0].id).toBe('r-12');
  });

  it('updates the leaderboard cache', () => {
    const { result } = renderHook(() => useReferralStore());

    act(() => {
      result.current.updateLeaderboard([mockLeaderboardEntry(1), mockLeaderboardEntry(2)]);
    });

    expect(result.current.leaderboardCache).toHaveLength(2);
    expect(result.current.lastLeaderboardUpdate).not.toBeNull();
  });

  it('tracks terms acceptance and program settings', () => {
    const { result } = renderHook(() => useReferralStore());

    act(() => {
      result.current.updateTermsAccepted(true);
      result.current.setProgramSettings({ isEnabled: true, minSignupsForReward: 1 });
    });

    expect(result.current.termsAccepted).toBe(true);
    expect(result.current.programSettings).toEqual({ isEnabled: true, minSignupsForReward: 1 });
  });

  it('sets the dashboard data bundle', () => {
    const { result } = renderHook(() => useReferralStore());

    act(() => {
      result.current.setDashboardData({
        referrerId: address as never,
        stats: mockStats(),
        referralLinks: [mockLink('CODE1')],
        recentRewards: [mockReward('r-1')],
        leaderboardPosition: mockLeaderboardEntry(1),
      });
    });

    expect(result.current.currentStats?.totalSignups).toBe(4);
    expect(result.current.currentReferralLinks).toHaveLength(1);
    expect(result.current.recentRewards).toHaveLength(1);
    expect(result.current.leaderboardCache).toHaveLength(1);
  });

  it('auto-clears notifications after five seconds', () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useReferralStore());

    act(() => {
      result.current.setNotification('Rewards claimed', 'success');
    });

    expect(result.current.notificationMessage).toBe('Rewards claimed');
    expect(result.current.notificationType).toBe('success');

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.notificationMessage).toBeNull();
    expect(result.current.notificationType).toBeNull();
    jest.useRealTimers();
  });

  it('reset restores the initial state', () => {
    const { result } = renderHook(() => useReferralStore());

    act(() => {
      result.current.setReferrerId(address as never);
      result.current.addReferralLink(mockLink('CODE1'));
      result.current.updateStats(mockStats());
      result.current.reset();
    });

    expect(result.current.referrerId).toBeNull();
    expect(result.current.currentReferralLinks).toEqual([]);
    expect(result.current.currentStats).toBeNull();
  });
});

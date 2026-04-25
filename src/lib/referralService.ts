/**
 * Referral Service - API Integration Layer
 * Handles all backend communication for the referral system
 * with caching and error handling
 */

import {
  ReferralLink,
  ReferralStats,
  ReferralReward,
  ReferralDashboardData,
  WalletAddress,
  ReferralCode,
  LeaderboardEntry,
  CreateReferralLinkRequest,
  CreateReferralLinkResponse,
  TrackReferralClickRequest,
  RecordReferralSignupRequest,
  RecordReferralSignupResponse,
  ClaimRewardsRequest,
  ClaimRewardsResponse,
  GetLeaderboardRequest,
  GetLeaderboardResponse,
  OnChainRewardDistribution,
  ReferralProgramSettings,
} from '@/types/referral';
import { createCachedFetch } from './cacheManager';

/**
 * Configuration for API endpoints
 */
const getApiBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
};

/**
 * Referral Service Class
 */
export class ReferralService {
  private baseUrl: string;
  private apiKey?: string;

  constructor() {
    this.baseUrl = getApiBaseUrl();
    this.apiKey = process.env.NEXT_PUBLIC_API_KEY;
  }

  /**
   * Generate headers with authentication if available
   */
  private getHeaders(additionalHeaders?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...additionalHeaders,
    };

    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }

    return headers;
  }

  /**
   * Handle API errors with proper error messages
   */
  private handleError(error: unknown, context: string): never {
    if (error instanceof Response) {
      throw new Error(`${context}: ${error.statusText} (${error.status})`);
    }
    if (error instanceof Error) {
      throw new Error(`${context}: ${error.message}`);
    }
    throw new Error(`${context}: Unknown error occurred`);
  }

  /**
   * Create a new referral link for the user
   */
  async createReferralLink(
    request: CreateReferralLinkRequest
  ): Promise<CreateReferralLinkResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/referrals/links`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw response;
      }

      return await response.json();
    } catch (error) {
      this.handleError(error, 'Failed to create referral link');
    }
  }

  /**
   * Get all referral links for a user
   */
  async getReferralLinks(referrerId: WalletAddress): Promise<ReferralLink[]> {
    return createCachedFetch(
      async () => {
        const response = await fetch(
          `${this.baseUrl}/api/referrals/links/${referrerId}`,
          {
            headers: this.getHeaders(),
          }
        );

        if (!response.ok) {
          throw response;
        }

        return await response.json();
      },
      {
        strategy: 'cache-first',
      }
    );
  }

  /**
   * Get referral statistics for a user
   */
  async getReferralStats(referrerId: WalletAddress): Promise<ReferralStats> {
    return createCachedFetch(
      async () => {
        const response = await fetch(
          `${this.baseUrl}/api/referrals/stats/${referrerId}`,
          {
            headers: this.getHeaders(),
          }
        );

        if (!response.ok) {
          throw response;
        }

        return await response.json();
      },
      {
        strategy: 'network-first', // Stats should be fresh
      }
    );
  }

  /**
   * Get complete referral dashboard data
   */
  async getDashboardData(referrerId: WalletAddress): Promise<ReferralDashboardData> {
    return createCachedFetch(
      async () => {
        const response = await fetch(
          `${this.baseUrl}/api/referrals/dashboard/${referrerId}`,
          {
            headers: this.getHeaders(),
          }
        );

        if (!response.ok) {
          throw response;
        }

        return await response.json();
      },
      {
        strategy: 'network-first',
      }
    );
  }

  /**
   * Track a referral click
   */
  async trackReferralClick(request: TrackReferralClickRequest): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/referrals/track-click`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw response;
      }
    } catch (error) {
      this.handleError(error, 'Failed to track referral click');
    }
  }

  /**
   * Record a referral signup/conversion
   */
  async recordReferralSignup(
    request: RecordReferralSignupRequest
  ): Promise<RecordReferralSignupResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/referrals/record-signup`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw response;
      }

      return await response.json();
    } catch (error) {
      this.handleError(error, 'Failed to record referral signup');
    }
  }

  /**
   * Get recent rewards for a user
   */
  async getRecentRewards(
    referrerId: WalletAddress,
    limit: number = 10
  ): Promise<ReferralReward[]> {
    return createCachedFetch(
      async () => {
        const response = await fetch(
          `${this.baseUrl}/api/referrals/rewards/${referrerId}?limit=${limit}`,
          {
            headers: this.getHeaders(),
          }
        );

        if (!response.ok) {
          throw response;
        }

        return await response.json();
      },
      {
        strategy: 'network-first',
      }
    );
  }

  /**
   * Get pending/claimable rewards
   */
  async getClaimableRewards(referrerId: WalletAddress): Promise<ReferralReward[]> {
    return createCachedFetch(
      async () => {
        const response = await fetch(
          `${this.baseUrl}/api/referrals/rewards/${referrerId}/claimable`,
          {
            headers: this.getHeaders(),
          }
        );

        if (!response.ok) {
          throw response;
        }

        return await response.json();
      },
      {
        strategy: 'network-first',
      }
    );
  }

  /**
   * Claim rewards on-chain
   */
  async claimRewards(request: ClaimRewardsRequest): Promise<ClaimRewardsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/referrals/rewards/claim`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw response;
      }

      return await response.json();
    } catch (error) {
      this.handleError(error, 'Failed to claim rewards');
    }
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(
    request: GetLeaderboardRequest
  ): Promise<GetLeaderboardResponse> {
    const params = new URLSearchParams();
    if (request.limit) params.append('limit', request.limit.toString());
    if (request.offset) params.append('offset', request.offset.toString());
    if (request.sortBy) params.append('sortBy', request.sortBy);
    if (request.chainId) params.append('chainId', request.chainId.toString());

    return createCachedFetch(
      async () => {
        const response = await fetch(
          `${this.baseUrl}/api/referrals/leaderboard?${params.toString()}`,
          {
            headers: this.getHeaders(),
          }
        );

        if (!response.ok) {
          throw response;
        }

        return await response.json();
      },
      {
        strategy: 'stale-while-revalidate', // Leaderboard can be slightly stale
      }
    );
  }

  /**
   * Get user's leaderboard position
   */
  async getUserLeaderboardPosition(
    referrerId: WalletAddress
  ): Promise<LeaderboardEntry | null> {
    return createCachedFetch(
      async () => {
        const response = await fetch(
          `${this.baseUrl}/api/referrals/leaderboard/position/${referrerId}`,
          {
            headers: this.getHeaders(),
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            return null;
          }
          throw response;
        }

        return await response.json();
      },
      {
        strategy: 'network-first',
      }
    );
  }

  /**
   * Get referral program settings
   */
  async getProgramSettings(): Promise<ReferralProgramSettings> {
    return createCachedFetch(
      async () => {
        const response = await fetch(
          `${this.baseUrl}/api/referrals/settings`,
          {
            headers: this.getHeaders(),
          }
        );

        if (!response.ok) {
          throw response;
        }

        return await response.json();
      },
      {
        strategy: 'cache-first', // Settings don't change often
      }
    );
  }

  /**
   * Accept terms and conditions
   */
  async acceptTermsAndConditions(
    referrerId: WalletAddress,
    version: string,
    signature?: string
  ): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/referrals/terms/accept`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            referrerId,
            version,
            signature,
            acceptedAt: Date.now(),
          }),
        }
      );

      if (!response.ok) {
        throw response;
      }
    } catch (error) {
      this.handleError(error, 'Failed to accept terms and conditions');
    }
  }

  /**
   * Get on-chain reward distribution history
   */
  async getRewardDistributionHistory(
    referrerId: WalletAddress,
    chainId: number,
    limit: number = 20
  ): Promise<OnChainRewardDistribution[]> {
    return createCachedFetch(
      async () => {
        const response = await fetch(
          `${this.baseUrl}/api/referrals/distributions/${referrerId}?chainId=${chainId}&limit=${limit}`,
          {
            headers: this.getHeaders(),
          }
        );

        if (!response.ok) {
          throw response;
        }

        return await response.json();
      },
      {
        strategy: 'network-first',
      }
    );
  }

  /**
   * Verify referral code validity
   */
  async verifyReferralCode(code: ReferralCode): Promise<{
    isValid: boolean;
    referrerAddress?: WalletAddress;
    rewardAmount?: string;
  }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/referrals/verify/${code}`,
        {
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw response;
      }

      return await response.json();
    } catch (error) {
      this.handleError(error, 'Failed to verify referral code');
    }
  }

  /**
   * Generate short URL for referral link
   */
  async generateShortUrl(longUrl: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/referrals/short-url`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ longUrl }),
      });

      if (!response.ok) {
        throw response;
      }

      const data = await response.json();
      return data.shortUrl;
    } catch (error) {
      // Fall back to long URL if short URL generation fails
      return longUrl;
    }
  }

  /**
   * Export referral statistics to CSV
   */
  async exportStatisticsToCsv(referrerId: WalletAddress): Promise<Blob> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/referrals/export/${referrerId}`,
        {
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw response;
      }

      return await response.blob();
    } catch (error) {
      this.handleError(error, 'Failed to export statistics');
    }
  }

  /**
   * Resend invitation email
   */
  async resendInvitation(invitationId: string): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/referrals/invitations/${invitationId}/resend`,
        {
          method: 'POST',
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw response;
      }
    } catch (error) {
      this.handleError(error, 'Failed to resend invitation');
    }
  }
}

/**
 * Singleton instance of ReferralService
 */
export const referralService = new ReferralService();

/**
 * Export for convenience
 */
export default referralService;

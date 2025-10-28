import { apiClient } from './apiClient';

export interface ReferralRewardView {
  stars: number;
  effectiveStars: number;
  cosmeticId?: string | null;
  title?: string;
  description?: string;
  multiplier: number;
}

export interface ReferralMilestoneView {
  id: string;
  title: string;
  description?: string;
  threshold: number;
  claimed: boolean;
  claimable: boolean;
  progress: {
    current: number;
    remaining: number;
    percentage: number;
  };
  reward: ReferralRewardView;
}

export interface ReferralEventView {
  id: string;
  label: string;
  description?: string;
  start: string;
  end: string;
  inviteeRewardMultiplier?: number;
  referrerRewardMultiplier?: number;
  milestoneRewardMultiplier?: number;
}

export interface ReferralSummary {
  code: string;
  shareUrl: string | null;
  inviteeReward: ReferralRewardView;
  referrerReward: ReferralRewardView;
  totalActivations: number;
  dailyActivations: {
    used: number;
    limit: number;
  };
  milestones: ReferralMilestoneView[];
  activeEvents: ReferralEventView[];
  stats: {
    totalRewardsClaimed: number;
    dailyRewardsUsed: number;
    dailyRewardLimit: number;
  };
  referredBy?: {
    userId: string;
    username: string | null;
    firstName: string | null;
  } | null;
  lastUpdated: string;
}

interface ReferralResponse {
  referral: ReferralSummary;
}

export async function fetchReferralSummary(): Promise<ReferralSummary> {
  const response = await apiClient.get<ReferralResponse>('/referrals');
  return response.data.referral;
}

export async function activateReferralCode(code: string): Promise<ReferralSummary> {
  const response = await apiClient.post<ReferralResponse>('/referrals/activate', { code });
  return response.data.referral;
}

export async function claimReferralMilestone(milestoneId: string): Promise<ReferralSummary> {
  const response = await apiClient.post<ReferralResponse>(
    `/referrals/milestones/${milestoneId}/claim`
  );
  return response.data.referral;
}

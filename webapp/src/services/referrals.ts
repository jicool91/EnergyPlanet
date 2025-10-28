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

type RawReferralReward = {
  stars?: number;
  effective_stars?: number;
  cosmetic_id?: string | null;
  title?: string;
  description?: string;
  multiplier?: number;
};

type RawReferralMilestone = {
  id: string;
  title: string;
  description?: string;
  threshold: number;
  claimed: boolean;
  claimable: boolean;
  progress?: {
    current?: number;
    remaining?: number;
    percentage?: number;
  };
  reward?: RawReferralReward;
};

type RawReferralSummary = {
  code?: string;
  share_url?: string | null;
  invitee_reward?: RawReferralReward | null;
  referrer_reward?: RawReferralReward | null;
  total_activations?: number;
  daily_activations?: {
    used?: number;
    limit?: number;
  } | null;
  milestones?: RawReferralMilestone[] | null;
  active_events?: Array<{
    id: string;
    label: string;
    description?: string;
    start?: string;
    end?: string;
    invitee_reward_multiplier?: number;
    referrer_reward_multiplier?: number;
    milestone_reward_multiplier?: number;
  }> | null;
  stats?: {
    total_rewards_claimed?: number;
    daily_rewards_used?: number;
    daily_reward_limit?: number;
  } | null;
  referred_by?: {
    user_id: string;
    username?: string | null;
    first_name?: string | null;
  } | null;
  last_updated?: string;
};

const mapReward = (raw?: RawReferralReward | null): ReferralRewardView => ({
  stars: raw?.stars ?? 0,
  effectiveStars: raw?.effective_stars ?? raw?.stars ?? 0,
  multiplier: raw?.multiplier ?? 1,
  cosmeticId: raw?.cosmetic_id ?? null,
  title: raw?.title,
  description: raw?.description,
});

const mapMilestone = (raw: RawReferralMilestone): ReferralMilestoneView => ({
  id: raw.id,
  title: raw.title,
  description: raw.description,
  threshold: raw.threshold,
  claimed: raw.claimed,
  claimable: raw.claimable,
  progress: {
    current: raw.progress?.current ?? 0,
    remaining: raw.progress?.remaining ?? 0,
    percentage: raw.progress?.percentage ?? 0,
  },
  reward: mapReward(raw.reward),
});

const mapReferralSummary = (raw?: RawReferralSummary | null): ReferralSummary => ({
  code: raw?.code ?? '------',
  shareUrl: raw?.share_url ?? null,
  inviteeReward: mapReward(raw?.invitee_reward),
  referrerReward: mapReward(raw?.referrer_reward),
  totalActivations: raw?.total_activations ?? 0,
  dailyActivations: {
    used: raw?.daily_activations?.used ?? 0,
    limit: raw?.daily_activations?.limit ?? 0,
  },
  milestones: Array.isArray(raw?.milestones)
    ? raw!.milestones!.map(mapMilestone)
    : ([] as ReferralMilestoneView[]),
  activeEvents: Array.isArray(raw?.active_events)
    ? raw!.active_events!.map(event => ({
        id: event.id,
        label: event.label,
        description: event.description,
        start: event.start ?? '',
        end: event.end ?? '',
        inviteeRewardMultiplier: event.invitee_reward_multiplier,
        referrerRewardMultiplier: event.referrer_reward_multiplier,
        milestoneRewardMultiplier: event.milestone_reward_multiplier,
      }))
    : [],
  stats: {
    totalRewardsClaimed: raw?.stats?.total_rewards_claimed ?? 0,
    dailyRewardsUsed: raw?.stats?.daily_rewards_used ?? 0,
    dailyRewardLimit: raw?.stats?.daily_reward_limit ?? 0,
  },
  referredBy: raw?.referred_by
    ? {
        userId: raw.referred_by.user_id,
        username: raw.referred_by.username ?? null,
        firstName: raw.referred_by.first_name ?? null,
      }
    : null,
  lastUpdated: raw?.last_updated ?? new Date().toISOString(),
});

export async function fetchReferralSummary(): Promise<ReferralSummary> {
  const response = await apiClient.get<{ referral: RawReferralSummary }>('/referrals');
  return mapReferralSummary(response.data.referral);
}

export async function activateReferralCode(code: string): Promise<ReferralSummary> {
  const response = await apiClient.post<{ referral: RawReferralSummary }>('/referrals/activate', {
    code,
  });
  return mapReferralSummary(response.data.referral);
}

export async function claimReferralMilestone(milestoneId: string): Promise<ReferralSummary> {
  const response = await apiClient.post<{ referral: RawReferralSummary }>(
    `/referrals/milestones/${milestoneId}/claim`
  );
  return mapReferralSummary(response.data.referral);
}

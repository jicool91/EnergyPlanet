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
  revenueShare: {
    percentage: number;
    dailyCap?: number;
    monthlyCap?: number;
  } | null;
  revenue: {
    totalEarned: number;
    monthEarned: number;
    todayEarned: number;
    lastUpdated: string;
  };
  referredBy?: {
    userId: string;
    username: string | null;
    firstName: string | null;
  } | null;
  lastUpdated: string;
}

export interface ReferralRevenueEvent {
  id: string;
  shareAmount: number;
  purchaseAmount: number;
  purchaseId: string;
  purchaseType: string;
  referred: {
    userId: string;
    username: string | null;
    firstName: string | null;
  };
  grantedAt: string;
}

export interface ReferralRevenueFriend {
  referred: {
    userId: string;
    username: string | null;
    firstName: string | null;
  };
  totalShare: number;
  totalPurchase: number;
  lastShare: number | null;
  lastPurchase: number | null;
  lastPurchaseAt: string | null;
}

export interface ReferralRevenueOverview {
  revenueShare: {
    percentage: number;
    dailyCap?: number;
    monthlyCap?: number;
  } | null;
  totals: {
    allTime: number;
    month: number;
    today: number;
  };
  recent: ReferralRevenueEvent[];
  friends: ReferralRevenueFriend[];
  updatedAt: string;
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
  shareUrl?: string | null;
  invitee_reward?: RawReferralReward | null;
  inviteeReward?: RawReferralReward | null;
  referrer_reward?: RawReferralReward | null;
  referrerReward?: RawReferralReward | null;
  total_activations?: number;
  totalActivations?: number;
  daily_activations?: {
    used?: number;
    limit?: number;
  } | null;
  dailyActivations?: {
    used?: number;
    limit?: number;
  } | null;
  milestones?: RawReferralMilestone[] | null;
  milestonesCamel?: RawReferralMilestone[] | null; // placeholder? maybe not needed
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
  activeEvents?: Array<{
    id: string;
    label: string;
    description?: string;
    start?: string;
    end?: string;
    inviteeRewardMultiplier?: number;
    referrerRewardMultiplier?: number;
    milestoneRewardMultiplier?: number;
  }> | null;
  stats?: {
    total_rewards_claimed?: number;
    daily_rewards_used?: number;
    daily_reward_limit?: number;
  } | null;
  revenue_share?: {
    percentage?: number;
    daily_cap?: number;
    monthly_cap?: number;
  } | null;
  revenueShare?: {
    percentage?: number;
    dailyCap?: number;
    monthlyCap?: number;
  } | null;
  revenue?: {
    total_earned?: number;
    month_earned?: number;
    today_earned?: number;
    last_updated?: string;
  } | null;
  revenueCamel?: {
    totalEarned?: number;
    monthEarned?: number;
    todayEarned?: number;
    lastUpdated?: string;
  } | null;
  referred_by?: {
    user_id: string;
    username?: string | null;
    first_name?: string | null;
  } | null;
  referredBy?: {
    userId: string;
    username?: string | null;
    firstName?: string | null;
  } | null;
  last_updated?: string;
  lastUpdated?: string;
};

type RawReferralRevenueEvent = {
  id?: string;
  share_amount?: number;
  purchase_amount?: number;
  purchase_id?: string;
  purchase_type?: string;
  referred?: {
    user_id?: string;
    username?: string | null;
    first_name?: string | null;
  } | null;
  granted_at?: string;
};

type RawReferralRevenueFriend = {
  referred?: {
    user_id?: string;
    username?: string | null;
    first_name?: string | null;
  } | null;
  total_share?: number;
  total_purchase?: number;
  last_share?: number | null;
  last_purchase?: number | null;
  last_purchase_at?: string | null;
};

type RawReferralRevenueOverview = {
  revenue_share?: {
    percentage?: number;
    daily_cap?: number;
    monthly_cap?: number;
  } | null;
  revenueShare?: {
    percentage?: number;
    dailyCap?: number;
    monthlyCap?: number;
  } | null;
  totals?: {
    all_time?: number;
    month?: number;
    today?: number;
  } | null;
  totalsCamel?: {
    allTime?: number;
    month?: number;
    today?: number;
  } | null;
  recent?: RawReferralRevenueEvent[] | null;
  recentCamel?: RawReferralRevenueEvent[] | null;
  friends?: RawReferralRevenueFriend[] | null;
  friendsCamel?: RawReferralRevenueFriend[] | null;
  updated_at?: string;
  updatedAt?: string;
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

const mapReferralSummary = (raw?: RawReferralSummary | null): ReferralSummary => {
  const camel = (raw ?? {}) as Record<string, unknown>;
  const inviteeRaw = (raw?.invitee_reward ?? camel.inviteeReward) as RawReferralReward | null;
  const referrerRaw = (raw?.referrer_reward ?? camel.referrerReward) as RawReferralReward | null;
  const dailyRaw = (raw?.daily_activations ?? camel.dailyActivations) as {
    used?: number;
    limit?: number;
  } | null;
  const activeEventsRaw = (raw?.active_events ?? camel.activeEvents) as Array<{
    id: string;
    label: string;
    description?: string;
    start?: string;
    end?: string;
    invitee_reward_multiplier?: number;
    referrer_reward_multiplier?: number;
    milestone_reward_multiplier?: number;
    inviteeRewardMultiplier?: number;
    referrerRewardMultiplier?: number;
    milestoneRewardMultiplier?: number;
  }> | null;

  const revenueShareRaw = (raw?.revenue_share ?? camel.revenueShare) as {
    percentage?: number;
    daily_cap?: number;
    monthly_cap?: number;
    dailyCap?: number;
    monthlyCap?: number;
  } | null;

  const revenueRaw = (raw?.revenue ?? camel.revenue ?? camel.revenueCamel) as {
    total_earned?: number;
    month_earned?: number;
    today_earned?: number;
    last_updated?: string;
    totalEarned?: number;
    monthEarned?: number;
    todayEarned?: number;
    lastUpdated?: string;
  } | null;

  const referredByRaw = (raw?.referred_by ?? camel.referredBy) as {
    user_id: string;
    username?: string | null;
    first_name?: string | null;
    userId?: string;
    firstName?: string | null;
  } | null;

  return {
    code: raw?.code ?? (camel.code as string) ?? '------',
    shareUrl: (raw?.share_url ?? camel.shareUrl ?? null) as string | null,
    inviteeReward: mapReward(inviteeRaw),
    referrerReward: mapReward(referrerRaw),
    totalActivations: raw?.total_activations ?? (camel.totalActivations as number | undefined) ?? 0,
    dailyActivations: {
      used: dailyRaw?.used ?? 0,
      limit: dailyRaw?.limit ?? 0,
    },
    milestones: Array.isArray(raw?.milestones ?? camel.milestones)
      ? (raw?.milestones ?? (camel.milestones as RawReferralMilestone[])).map(mapMilestone)
      : ([] as ReferralMilestoneView[]),
    activeEvents: Array.isArray(activeEventsRaw)
      ? activeEventsRaw.map(event => ({
          id: event.id,
          label: event.label,
          description: event.description,
          start: event.start ?? '',
          end: event.end ?? '',
          inviteeRewardMultiplier: event.invitee_reward_multiplier ?? event.inviteeRewardMultiplier,
          referrerRewardMultiplier:
            event.referrer_reward_multiplier ?? event.referrerRewardMultiplier,
          milestoneRewardMultiplier:
            event.milestone_reward_multiplier ?? event.milestoneRewardMultiplier,
        }))
      : [],
    stats: {
      totalRewardsClaimed:
        raw?.stats?.total_rewards_claimed ??
        (camel.stats ? (camel.stats as Record<string, number>).totalRewardsClaimed : 0) ??
        0,
      dailyRewardsUsed:
        raw?.stats?.daily_rewards_used ??
        (camel.stats ? (camel.stats as Record<string, number>).dailyRewardsUsed : 0) ??
        0,
      dailyRewardLimit:
        raw?.stats?.daily_reward_limit ??
        (camel.stats ? (camel.stats as Record<string, number>).dailyRewardLimit : 0) ??
        0,
    },
    revenueShare: revenueShareRaw
      ? {
          percentage: revenueShareRaw.percentage ?? 0,
          dailyCap: revenueShareRaw.daily_cap ?? revenueShareRaw.dailyCap ?? undefined,
          monthlyCap: revenueShareRaw.monthly_cap ?? revenueShareRaw.monthlyCap ?? undefined,
        }
      : null,
    revenue: {
      totalEarned: revenueRaw?.total_earned ?? revenueRaw?.totalEarned ?? 0,
      monthEarned: revenueRaw?.month_earned ?? revenueRaw?.monthEarned ?? 0,
      todayEarned: revenueRaw?.today_earned ?? revenueRaw?.todayEarned ?? 0,
      lastUpdated:
        revenueRaw?.last_updated ??
        revenueRaw?.lastUpdated ??
        raw?.last_updated ??
        (camel.lastUpdated as string | undefined) ??
        new Date().toISOString(),
    },
    referredBy: referredByRaw
      ? {
          userId: referredByRaw.user_id ?? referredByRaw.userId ?? '',
          username: referredByRaw.username ?? null,
          firstName: referredByRaw.first_name ?? referredByRaw.firstName ?? null,
        }
      : null,
    lastUpdated:
      raw?.last_updated ?? (camel.lastUpdated as string | undefined) ?? new Date().toISOString(),
  };
};

const mapReferralRevenueEvent = (raw: RawReferralRevenueEvent): ReferralRevenueEvent => ({
  id:
    raw.id ??
    (raw.purchase_id && raw.granted_at
      ? `${raw.purchase_id}:${raw.granted_at}`
      : `rev_${Math.random().toString(36).slice(2)}`),
  shareAmount: raw.share_amount ?? 0,
  purchaseAmount: raw.purchase_amount ?? 0,
  purchaseId: raw.purchase_id ?? '',
  purchaseType: raw.purchase_type ?? 'purchase',
  referred: {
    userId: raw.referred?.user_id ?? '',
    username: raw.referred?.username ?? null,
    firstName: raw.referred?.first_name ?? null,
  },
  grantedAt: raw.granted_at ?? new Date().toISOString(),
});

const mapReferralRevenueFriend = (raw: RawReferralRevenueFriend): ReferralRevenueFriend => ({
  referred: {
    userId: raw.referred?.user_id ?? '',
    username: raw.referred?.username ?? null,
    firstName: raw.referred?.first_name ?? null,
  },
  totalShare: raw.total_share ?? 0,
  totalPurchase: raw.total_purchase ?? 0,
  lastShare: raw.last_share ?? null,
  lastPurchase: raw.last_purchase ?? null,
  lastPurchaseAt: raw.last_purchase_at ?? null,
});

const mapReferralRevenueOverview = (
  raw?: RawReferralRevenueOverview | null
): ReferralRevenueOverview => {
  const camel = (raw ?? {}) as Record<string, unknown>;
  const revenueShareRaw = (raw?.revenue_share ?? camel.revenueShare) as {
    percentage?: number;
    daily_cap?: number;
    monthly_cap?: number;
    dailyCap?: number;
    monthlyCap?: number;
  } | null;
  const totalsRaw = (raw?.totals ?? camel.totals ?? camel.totalsCamel) as {
    all_time?: number;
    month?: number;
    today?: number;
    allTime?: number;
  } | null;
  const recentRaw = (raw?.recent ?? camel.recent ?? camel.recentCamel) as
    | RawReferralRevenueEvent[]
    | null;
  const friendsRaw = (raw?.friends ?? camel.friends ?? camel.friendsCamel) as
    | RawReferralRevenueFriend[]
    | null;

  return {
    revenueShare: revenueShareRaw
      ? {
          percentage: revenueShareRaw.percentage ?? 0,
          dailyCap: revenueShareRaw.daily_cap ?? revenueShareRaw.dailyCap ?? undefined,
          monthlyCap: revenueShareRaw.monthly_cap ?? revenueShareRaw.monthlyCap ?? undefined,
        }
      : null,
    totals: {
      allTime: totalsRaw?.all_time ?? (totalsRaw?.allTime as number | undefined) ?? 0,
      month: totalsRaw?.month ?? 0,
      today: totalsRaw?.today ?? 0,
    },
    recent: Array.isArray(recentRaw)
      ? recentRaw.map(mapReferralRevenueEvent)
      : ([] as ReferralRevenueEvent[]),
    friends: Array.isArray(friendsRaw)
      ? friendsRaw.map(mapReferralRevenueFriend)
      : ([] as ReferralRevenueFriend[]),
    updatedAt:
      raw?.updated_at ?? (camel.updatedAt as string | undefined) ?? new Date().toISOString(),
  };
};

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

export async function fetchReferralRevenueOverview(): Promise<ReferralRevenueOverview> {
  const response = await apiClient.get<{ revenue: RawReferralRevenueOverview }>(
    '/referrals/revenue'
  );
  return mapReferralRevenueOverview(response.data.revenue);
}

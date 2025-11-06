import { isAxiosError } from 'axios';
import { apiClient } from './apiClient';

export interface MonetizationMetricDay {
  date: string;
  shopTabImpressions: number;
  shopViews: number;
  shopVisitRate: number | null;
  questClaimStarts: number;
  questClaimSuccess: number;
  questClaimSuccessRate: number | null;
  dailyBoostUpsellViews: number;
  dailyBoostUpsellClicks: number;
  dailyBoostUpsellCtr: number | null;
}

export interface MonetizationMetrics {
  generatedAt: string;
  windowStart: string;
  windowEnd: string;
  days: number;
  daily: MonetizationMetricDay[];
}

export async function fetchMonetizationMetrics(days?: number): Promise<MonetizationMetrics> {
  const params = days ? { days } : undefined;
  const response = await apiClient.get<MonetizationMetrics>('/admin/monetization/metrics', {
    params,
  });
  return response.data;
}

export interface SeasonLeaderboardItem {
  userId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  finalRank: number | null;
  finalElo: number | null;
  finalTier: string | null;
  rewardTier: 'gold' | 'silver' | 'bronze';
  couponCode: string | null;
  rewards: Record<string, unknown>;
  claimed: boolean;
  claimedAt: string | null;
  energyTotal: number;
}

export interface SeasonSnapshot {
  seasonId: string;
  seasonNumber: number;
  name: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  rewards: Record<string, unknown>;
  leaderboard: SeasonLeaderboardItem[];
  generatedAt: string;
}

export async function fetchSeasonSnapshot(): Promise<SeasonSnapshot | null> {
  try {
    const response = await apiClient.get<SeasonSnapshot>('/admin/seasons/snapshot');
    return response.data;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

export interface RewardSeasonPayload {
  userId: string;
  rewardTier: 'gold' | 'silver' | 'bronze';
  couponCode?: string;
  note?: string;
}

export async function rewardSeasonPlacement(
  seasonId: string,
  payload: RewardSeasonPayload
): Promise<void> {
  await apiClient.post(`/admin/seasons/${seasonId}/reward`, payload);
}

import { apiClient } from './apiClient';

export interface AchievementTierView {
  id: string;
  tier: number;
  threshold: number;
  rewardMultiplier: number;
  title: string | null;
  rewardSummary: string | null;
  earned: boolean;
  claimable: boolean;
}

export interface AchievementView {
  slug: string;
  name: string;
  description: string | null;
  category: string;
  icon: string | null;
  metric: string;
  unit: string;
  maxTier: number;
  currentTier: number;
  highestUnlockedTier: number;
  progressValue: number;
  nextThreshold: number | null;
  progressRatio: number;
  tiers: AchievementTierView[];
  claimableTier: number | null;
  claimedMultiplier: number;
  pendingMultiplier: number;
}

export interface AchievementListResponse {
  achievements: AchievementView[];
}

export interface AchievementClaimResponse {
  slug: string;
  tier: number;
  rewardMultiplier: number;
  newAchievementMultiplier: number;
}

export async function fetchAchievements(): Promise<AchievementView[]> {
  const response = await apiClient.get<AchievementListResponse>('/achievements');
  return response.data.achievements;
}

export async function claimAchievement(slug: string): Promise<AchievementClaimResponse> {
  const response = await apiClient.post<AchievementClaimResponse>(`/achievements/${slug}/claim`);
  return response.data;
}

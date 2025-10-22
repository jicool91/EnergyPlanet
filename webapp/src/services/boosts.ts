import { apiClient } from './apiClient';

export interface BoostActivePayload {
  id: string;
  expires_at: string;
  remaining_seconds: number;
}

export interface BoostHubItem {
  boost_type: 'ad_boost' | 'daily_boost' | 'premium_boost';
  multiplier: number;
  duration_minutes: number;
  cooldown_minutes: number;
  requires_premium: boolean;
  active: BoostActivePayload | null;
  cooldown_remaining_seconds: number;
  available_at: string;
}

export interface BoostHubResponse {
  server_time: string;
  boosts: BoostHubItem[];
}

export async function fetchBoostHub(): Promise<BoostHubResponse> {
  const response = await apiClient.get<BoostHubResponse>('/boost');
  return response.data;
}

export async function claimBoost(boostType: string): Promise<void> {
  await apiClient.post('/boost/claim', { boost_type: boostType });
}

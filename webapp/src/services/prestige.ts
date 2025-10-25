import { apiClient } from './apiClient';

export interface PrestigeStatus {
  prestige_level: number;
  prestige_multiplier: number;
  total_energy_produced: number;
  energy_since_prestige: number;
  potential_multiplier_gain: number;
  potential_multiplier_after_prestige: number;
  next_threshold_energy: number;
  energy_to_next_threshold: number;
  can_prestige: boolean;
}

export interface PrestigePerformResponse {
  prestige_level: number;
  prestige_multiplier: number;
  gain: number;
  energy_since_prestige: number;
  boosts_cleared: number;
}

export async function fetchPrestigeStatus(): Promise<PrestigeStatus> {
  const response = await apiClient.get<PrestigeStatus>('/prestige');
  return response.data;
}

export async function performPrestigeReset(): Promise<PrestigePerformResponse> {
  const response = await apiClient.post<PrestigePerformResponse>('/prestige');
  return response.data;
}

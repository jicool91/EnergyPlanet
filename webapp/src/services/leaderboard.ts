import { apiClient } from './apiClient';

export interface LeaderboardUserEntry {
  rank: number;
  user_id: string;
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  level: number;
  total_energy_produced: number;
  equipped_avatar_frame: string | null;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardUserEntry[];
  total_players: number;
  user_rank: number | null;
  user_entry: LeaderboardUserEntry | null;
}

export async function fetchLeaderboard(limit = 100): Promise<LeaderboardResponse> {
  const response = await apiClient.get<LeaderboardResponse>('/leaderboard', {
    params: { limit },
  });
  return response.data;
}

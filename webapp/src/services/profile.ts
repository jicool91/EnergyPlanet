import { apiClient } from './apiClient';

export interface ProfileResponse {
  user: {
    id: string;
    telegram_id: number;
    username: string | null;
    first_name: string | null;
    last_name: string | null;
    is_admin: boolean;
  };
  profile: {
    equipped_avatar_frame: string | null;
    equipped_planet_skin: string | null;
    equipped_tap_effect: string | null;
    equipped_background: string | null;
    bio: string | null;
    is_public: boolean;
    updated_at: string;
  };
  progress: {
    level: number;
    xp: number;
    xp_into_level: number;
    xp_to_next_level: number;
    total_energy_produced: number;
    energy: number;
    tap_level: number;
    tap_income: number;
    passive_income_per_sec: number;
    passive_income_multiplier: number;
    boost_multiplier: number;
    prestige_multiplier: number;
    prestige_level: number;
    prestige_energy_since_reset: number;
    prestige_last_reset: string | null;
    last_login: string | null;
    last_logout: string | null;
  };
  boosts: Array<{
    id: string;
    boost_type: string;
    multiplier: number;
    expires_at: string;
  }>;
  buildings: Array<{
    buildingId: string;
    name: string;
    count: number;
    level: number;
    incomePerSec: number;
  }>;
}

export async function fetchProfile(userId: string): Promise<ProfileResponse> {
  const response = await apiClient.get<ProfileResponse>(`/profile/${userId}`);
  return response.data;
}

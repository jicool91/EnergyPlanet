import { apiClient } from './apiClient';

export interface BuildingDefinition {
  id: string;
  name: string;
  description?: string;
  tier: number | null;
  base_income: number;
  base_cost: number;
  cost_multiplier: number | null;
  upgrade_cost_multiplier: number | null;
  upgrade_income_bonus: number | null;
  unlock_level: number | null;
  max_count: number | null;
  category: string | null;
  rarity: string | null;
  payback_seconds: number | null;
  roi_rank: number | null;
}

export async function fetchBuildingCatalog(): Promise<BuildingDefinition[]> {
  const response = await apiClient.get<{ buildings: BuildingDefinition[] }>('/buildings');
  return response.data.buildings ?? [];
}
